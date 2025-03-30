import { Context } from "hono";
import { genToken } from "../utils";
import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import ffmpeg from "fluent-ffmpeg";
import { createReadStream } from "fs";
import { LumaAI } from "lumaai";
import OpenAI from "openai";
import { z } from "zod";
import {
  VIDEO_SCRIPT_PROMPT,
  VISUAL_KEYWORD__SCRIPT_PROMPT,
  getStorytellingPrompt,
  getStorytellingPromptForTitle,
  getVideoGenerationPromptFromScript,
} from "../utils/prompts";
import uploadToS3 from "../components/uploadToS3";
import { Video } from "../models";

const lumaClient = new LumaAI({
  authToken: process.env.LUMA_API_KEY,
});

const filePath = `./assets/${new Date().getTime()}/`;

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

ffmpeg.setFfmpegPath("/opt/homebrew/bin/ffmpeg");
ffmpeg.setFfprobePath("/opt/homebrew/bin/ffprobe");

const extractAudio = (videoPath: string, audioPath: string) => {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .output(audioPath)
      .noVideo()
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
};

const transcribeAudioToSRT = async (
  audioPath: string,
  outputSrtPath: string
) => {
  try {
    console.log("Uploading audio for transcription...");

    // Transcribe audio using Whisper API
    const response = await openaiClient.audio.transcriptions.create({
      file: createReadStream(audioPath),
      model: "whisper-1",
      response_format: "srt", // Get subtitles in SRT format
    });

    // Save the generated SRT file
    await Bun.write(outputSrtPath, response);
    console.log(`SRT subtitles saved to: ${outputSrtPath}`);
  } catch (error) {
    console.error("Error transcribing audio:", error);
  }
};

const addSubtitlesToVideo = (
  inputVideo: string,
  subtitleFile: string,
  outputVideo: string
) => {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputVideo)
      .outputOptions([
        //`-vf subtitles=${subtitleFile}:force_style='FontName=Arial,FontSize=24,PrimaryColour=&H00FFFF00'`, // Burn subtitles
        `-vf subtitles=${subtitleFile}`,
        "-c:v libx264", // Video encoding
        "-c:a copy", // Keep original audio
        "-y", // Overwrite output file
      ])
      .output(outputVideo)
      .on("progress", (progress) => {
        console.log(`Processing: ${progress.percent?.toFixed(2)}% done`);
      })
      .on("end", () => {
        console.log("Subtitles merged successfully! ✅");
        resolve();
      })
      .on("error", (err) => {
        console.error("Error merging subtitles:", err);
        reject(err);
      })
      .run();
  });
};

const processVideo = async (videoFile: string, outputSrtFile: string) => {
  const audioFile = "extracted_audio.mp3";

  console.log("Extracting audio from video...");
  await extractAudio(videoFile, audioFile);

  console.log("Transcribing to SRT...");
  await transcribeAudioToSRT(audioFile, outputSrtFile);
};

const getDuration = (filePath: string): Promise<number> => {
  console.log("==> filePath", filePath);
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
};

const trimAudio = (
  inputAudio: string,
  outputAudio: string,
  duration: number
) => {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputAudio)
      .setDuration(duration)
      .output(outputAudio)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
};

const loopVideo = (
  inputVideo: string,
  inputAudio: string,
  outputVideo: string,
  duration: number
) => {
  return new Promise<void>((resolve, reject) => {
    console.log("==> looping video", inputVideo);
    console.log("==> looping video", outputVideo);
    console.log("==> looping video", duration);

    ffmpeg(inputVideo)
      .inputOptions(["-stream_loop -1"]) // Loop video indefinitely
      .setDuration(duration) // Trim the final looped output to match the required duration
      .input(inputAudio)
      .outputOptions([
        "-c:v libx264", // Video encoding (H.264 for compatibility)
        "-c:a aac", // Audio encoding (AAC for compatibility)
        "-strict experimental", // Ensures AAC is used correctly
        "-shortest", // Ensures the video stops when the audio ends
      ])
      .output(outputVideo)
      .on("start", (commandLine) => {
        console.log("Spawned Ffmpeg with command: " + commandLine);
      })
      .on("stderr", (stderrLine) => {
        console.log("Stderr output: " + stderrLine);
      })
      .on("progress", (progress) => {
        if (progress.percent) {
          console.log(`Processing: ${progress.percent.toFixed(2)}% done`);
        }
      })
      .on("end", () => {
        console.log("Looping complete! ✅... outputVideo: ", outputVideo);
        resolve();
      })
      .on("error", (err) => {
        console.error("Error processing video:", err);
        reject(err);
      })
      .run();
  });
};

const adjustAudioSpeed = (
  inputAudio: string,
  outputAudio: string,
  speedFactor: number
) => {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputAudio)
      .audioFilters(`atempo=${speedFactor}`)
      .output(outputAudio)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
};

const mergeVideosReencode = (filePath: string) => {
  console.log("==> merging videos", filePath);
  const outputPath = `${filePath}final_output.mp4`;

  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(`${filePath}final_hook_output.mp4`)
      .input(`${filePath}final_intro_output.mp4`)
      .input(`${filePath}final_body_output.mp4`)
      .input(`${filePath}final_conclusion_output.mp4`)
      .input(`${filePath}final_call_to_action_output.mp4`)
      .complexFilter("concat=n=5:v=1:a=1 [v] [a]")
      .outputOptions([
        "-map [v]",
        "-map [a]",
        "-c:v libx264",
        "-c:a aac",
        "-strict experimental",
      ])
      .output(outputPath)
      .on("start", (commandLine) => {
        console.log("===========> Spawned Ffmpeg with command: " + commandLine);
      })
      .on("stderr", (stderrLine) => {
        console.log("Stderr output: " + stderrLine);
      })
      .on("progress", (progress) => {
        if (progress.percent) {
          console.log(`Processing: ${progress.percent.toFixed(2)}% done`);
        }
      })
      .on("end", () => {
        console.log("=================> ✅ Merging complete! ");
        resolve();
      })
      .on("error", (err) => {
        console.error("Error processing video:", err);
        reject(err);
      })
      .run();
  });
};

const mergeAudioVideo = (
  inputVideo: string,
  inputAudio: string,
  outputFile: string
) => {
  console.log("==> merging video and audio", inputVideo);
  console.log("==> merging video and audio", inputAudio);
  console.log("==> merging video and audio", outputFile);

  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(inputVideo)
      .input(inputAudio)
      .outputOptions([
        "-c:v libx264", // Video encoding (H.264 for compatibility)
        "-c:a aac", // Audio encoding (AAC for compatibility)
        "-strict experimental", // Ensures AAC is used correctly
        "-shortest", // Ensures the video stops when the audio ends
      ])
      .output(outputFile)
      .on("start", (commandLine) => {
        console.log("Spawned Ffmpeg with command: " + commandLine);
      })
      .on("stderr", (stderrLine) => {
        console.log("Stderr output: " + stderrLine);
      })
      .on("progress", (progress) => {
        if (progress.percent) {
          console.log(`Processing: ${progress.percent.toFixed(2)}% done`);
        }
      })
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
};

const processMedia = async (
  videoFile: string,
  audioFile: string,
  outputFile: string
) => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const videoDuration = await getDuration(videoFile);
      const audioDuration = await getDuration(audioFile);

      console.log(`Video Duration: ${videoDuration}s`);
      console.log(`Audio Duration: ${audioDuration}s`);

      if (audioDuration > videoDuration) {
        console.log("Looping video to match audio length...");
        await loopVideo(videoFile, audioFile, outputFile, audioDuration);
      } else {
        await mergeAudioVideo(videoFile, audioFile, outputFile);
      }

      console.log("Processing complete!");
      resolve();
    } catch (error) {
      console.error("Error processing media:", error);
      reject(error);
    }
  });
};

async function generateAudio(text: string, filename: string) {
  console.log(`==> Generating audio for text... [FilePath] ${filename}`);

  const mp3 = await openaiClient.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "nova",
    input: text,
  });
  const buffer = Buffer.from(await mp3.arrayBuffer());
  //   await fs.writeFile(filename, new Uint8Array(buffer));
  await Bun.write(filename, new Uint8Array(buffer));
}

const generateVideo = async (videoPrompt: string, fileName: string) => {
  // let generation = await lumaClient.generations.create({
  //   prompt: videoPrompt,
  // });

  let generation = await lumaClient.generations.video.create({
    prompt: videoPrompt,
    aspect_ratio: "9:16",
    // loop: true,
  });

  let completed = false;

  while (!completed) {
    generation = await lumaClient.generations.get(generation.id!);

    if (generation.state === "completed") {
      completed = true;
    } else if (generation.state === "failed") {
      throw new Error(`Generation failed: ${generation.failure_reason}`);
    } else {
      console.log(
        `[${generation.id}] Generating video... [filePath] ${fileName}`
      );
      await new Promise((r) => setTimeout(r, 3000)); // Wait for 3 seconds
    }
  }

  const videoUrl = generation.assets?.video;

  console.log("Video URL:", videoUrl);
  if (!videoUrl) {
    throw new Error("Video generation failed");
  }
  await saveVideo(videoUrl, fileName);
};

const generateScript = async (topic: string) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      story: z.string(),
      chapters: z.array(
        z.object({
          chapter: z.number(),
          lesson: z.string(),
          storyline: z.string(),
        })
      ),
    }),
    messages: [
      {
        role: "system",
        content: `You are a seasoned fiction story writer for a YouTube Shorts channel, specializing in facts videos. 
          Can break the story into 3 chapters. Each chapter should be a lesson and one line of the story. Use ghibli studio animation style storylines for characters.
          can you only respond with a valid JSON object. Please don't include any other information in your response.
          
          {
            "story": "The story of the little red hen",
            "chapters": [
              {
                "chapter": 1,
                "lesson": "The little
                "storyline": "The little red hen finds some wheat seeds"
              }
            ]
          }`,
      },
      {
        role: "user",
        content: `Generate a video script for the topic "${topic}"`,
      },
    ],
  });
  return object;
};

const generateImage = async (storyline: string) => {
  let generation = await lumaClient.generations.image.create({
    prompt: `create an image for the storyline: ${storyline}. Use ghibli studio animation style for characters`,
  });

  let completed = false;

  while (!completed) {
    generation = await lumaClient.generations.get(generation.id!);

    if (generation.state === "completed") {
      completed = true;
    } else if (generation.state === "failed") {
      throw new Error(`Generation failed: ${generation.failure_reason}`);
    } else {
      console.log("Dreaming...");
      await new Promise((r) => setTimeout(r, 3000)); // Wait for 3 seconds
    }
  }

  const imageUrl = generation?.assets?.image;

  return imageUrl;
};

const generateVisualKeywords = async (script: string) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-2024-08-06", {
      structuredOutputs: true,
    }),
    output: "array",
    schema: z.object({
      array: z.array(z.union([z.array(z.number()), z.array(z.string())])),
    }),
    messages: [
      {
        role: "system",
        content: VISUAL_KEYWORD__SCRIPT_PROMPT,
      },
      {
        role: "user",
        content: `Generate visual keywords for the script "${script}"`,
      },
    ],
  });
  return object;
};

const saveVideo = async (videoUrl: string, filename: string) => {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch video: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  await Bun.write(filename, new Uint8Array(buffer));
  console.log(`Video saved to ${filename}`);
};

const getVideoGenerationPrompt = async (script: string) => {
  const { object: videoPrompt } = await generateObject({
    model: openai("gpt-4o-mini"),
    prompt: getVideoGenerationPromptFromScript(script),
    schema: z.object({
      prompt: z.string(),
    }),
  });
  return videoPrompt.prompt;
};

/**
 * @api {post} /
 * @apiGroup Users
 * @access Private
 */
export const generateVideoScript = async (ctx: Context) => {
  const userId = await ctx.get("userId");
  const url = new URL(ctx.req.url);
  const topic = url.searchParams.get("topic");

  const stream = new ReadableStream({
    async start(controller) {
      const send = (step, message) => {
        controller.enqueue(`data: ${JSON.stringify({ step, message })}\n\n`);
      };

      send("start", "Started video generation");

      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: z.object({
          hook: z.string(),
          intro: z.string(),
          body: z.string(),
          conclusion: z.string(),
          call_to_action: z.string(),
        }),
        prompt: getStorytellingPromptForTitle(topic),
      });
      send("script", "Generated storytelling script");

      const prompts = {
        hook: await getVideoGenerationPrompt(object.hook),
        intro: await getVideoGenerationPrompt(object.intro),
        body: await getVideoGenerationPrompt(object.body),
        conclusion: await getVideoGenerationPrompt(object.conclusion),
        call_to_action: await getVideoGenerationPrompt(object.call_to_action),
      };
      send("prompts", "Created video prompts");

      const tasks = [
        ["hook", prompts.hook, object.hook],
        ["intro", prompts.intro, object.intro],
        ["body", prompts.body, object.body],
        ["conclusion", prompts.conclusion, object.conclusion],
        ["call_to_action", prompts.call_to_action, object.call_to_action],
      ];

      for (const [key, prompt, text] of tasks) {
        await generateVideo(prompt, `${filePath}${key}.mp4`);
        await generateAudio(text, `${filePath}${key}.mp3`);
        send(key, `Generated ${key} video and audio`);
        await processMedia(
          `${filePath}${key}.mp4`,
          `${filePath}${key}.mp3`,
          `${filePath}final_${key}_output.mp4`
        );
        send(`${key}_processed`, `Processed ${key} media`);
      }

      send("merging", "Merging video parts");
      await mergeVideosReencode(filePath);
      const outputPath = `${filePath}final_output.mp4`;
      const audioPath = `${filePath}final_output.mp3`;

      await extractAudio(outputPath, audioPath);
      send("audio_extracted", "Extracted audio");

      await transcribeAudioToSRT(audioPath, `${filePath}final_output.srt`);
      send("transcribed", "Transcribed audio to SRT");

      await addSubtitlesToVideo(
        outputPath,
        `${filePath}final_output.srt`,
        `${filePath}final_output_with_subtitles.mp4`
      );
      send("subtitles_added", "Added subtitles");

      const finalVideoPath = `${filePath}final_output_with_subtitles.mp4`;

      const upload = await uploadToS3({
        filePath: finalVideoPath,
        name: "final_output_with_subtitles.mp4",
        userId: userId,
      });
      send("uploaded", "Uploaded final video to S3");

      const video = await Video.create({
        createdBy: userId,
        videoType: "video",
        userId,
        title: topic,
        url: upload.url,
      });

      send("done", "Video generation complete");
      controller.enqueue(`event: end\ndata: done\n\n`);
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};

/**
 * @api {get} /users Get All Users
 * @apiGroup Users
 * @access Private
 */
export const getAllVideos = async (ctx: Context) => {
  const userId = await ctx.get("userId");

  try {
    const videos = await Video.find({ createdBy: userId }).sort({
      createdAt: -1,
    });

    if (!videos) {
      return ctx.json({ error: "No videos found" }, 404);
    }

    return ctx.json({ status: 200, success: true, data: videos }, 200);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return ctx.json({ error: "Failed to fetch videos" }, 500);
  }
};

/**
 * @api {get} /users/:id Get User by ID
 * @apiGroup Users
 * @access Private
 */
export const getVideoById = async (ctx: Context) => {
  const userId = await ctx.get("userId");
  const { id } = ctx.req.param();

  try {
    const video = await Video.findOne({ _id: id, createdBy: userId });

    if (!video) {
      return ctx.json({ error: "Video not found" }, 404);
    }

    console.log("==> video", video);

    return ctx.json({ status: 200, success: true, data: video }, 200);
  } catch (error) {
    console.error("Error fetching video:", error);
    return ctx.json({ error: "Failed to fetch video" }, 500);
  }
};

// export const generateVideoScript = async (ctx: Context) => {
//   const userId = await ctx.get("userId");
//   const body = await ctx.req.json();

//   console.log("==> body", body);
//   console.log("==> userId", userId);

//   const { object } = await generateObject({
//     model: openai("gpt-4o-mini"),
//     schema: z.object({
//       hook: z.string(),
//       intro: z.string(),
//       body: z.string(),
//       conclusion: z.string(),
//       call_to_action: z.string(),
//     }),
//     prompt: getStorytellingPromptForTitle(body.topic),
//   });
//   console.log("==> ", object);

//   const videoHookPrompt = await getVideoGenerationPrompt(object.hook);

//   console.log("==> Hook: ", videoHookPrompt);

//   const videoIntroPrompt = await getVideoGenerationPrompt(object.intro);

//   console.log("==> Intro: ", videoIntroPrompt);

//   const videoBodyPrompt = await getVideoGenerationPrompt(object.body);

//   console.log("==> Body: ", videoBodyPrompt);

//   const videoConclusionPrompt = await getVideoGenerationPrompt(
//     object.conclusion
//   );

//   console.log("==> Conclusion: ", videoConclusionPrompt);

//   const videoCallToActionPrompt = await getVideoGenerationPrompt(
//     object.call_to_action
//   );

//   console.log("==> Call to action: ", videoCallToActionPrompt);

//   await Promise.all([
//     await generateVideo(videoHookPrompt, filePath + "hook.mp4"),
//     await generateVideo(videoIntroPrompt, filePath + "intro.mp4"),
//     await generateVideo(videoBodyPrompt, filePath + "body.mp4"),
//     await generateVideo(videoConclusionPrompt, filePath + "conclusion.mp4"),
//     await generateVideo(
//       videoCallToActionPrompt,
//       filePath + "call_to_action.mp4"
//     ),
//     await generateAudio(object.hook, filePath + "hook.mp3"),
//     await generateAudio(object.intro, filePath + "intro.mp3"),
//     await generateAudio(object.body, filePath + "body.mp3"),
//     await generateAudio(object.conclusion, filePath + "conclusion.mp3"),
//     await generateAudio(object.call_to_action, filePath + "call_to_action.mp3"),
//   ]);

//   console.log("==> Done generating videos and audio");

//   console.log("==> Processing hook files...");
//   await processMedia(
//     `${filePath}hook.mp4`,
//     `${filePath}hook.mp3`,
//     `${filePath}final_hook_output.mp4`
//   )
//     .then(() => console.log("Processing complete!"))
//     .catch(console.error);

//   console.log("==> Processing intro files...");
//   await processMedia(
//     `${filePath}intro.mp4`,
//     `${filePath}intro.mp3`,
//     `${filePath}final_intro_output.mp4`
//   )
//     .then(() => console.log("Processing complete!"))
//     .catch(console.error);

//   console.log("==> Processing body files...");
//   await processMedia(
//     `${filePath}body.mp4`,
//     `${filePath}body.mp3`,
//     `${filePath}final_body_output.mp4`
//   )
//     .then(() => console.log("Processing complete!"))
//     .catch(console.error);

//   console.log("==> Processing conclusion files...");
//   await processMedia(
//     `${filePath}conclusion.mp4`,
//     `${filePath}conclusion.mp3`,
//     `${filePath}final_conclusion_output.mp4`
//   )
//     .then(() => console.log("Processing complete!"))
//     .catch(console.error);

//   console.log("==> Processing cta files...");
//   await processMedia(
//     `${filePath}call_to_action.mp4`,
//     `${filePath}call_to_action.mp3`,
//     `${filePath}final_call_to_action_output.mp4`
//   )
//     .then(() => console.log("Processing complete!"))
//     .catch(console.error);

//   console.log("==> Merging videos and audio");

//   await mergeVideosReencode(filePath);

//   console.log("=========> Merging videos and audio done");
//   const outputPath = `${filePath}final_output.mp4`;
//   const audioPath = `${filePath}final_output.mp3`;

//   const audioFilePath = await extractAudio(outputPath, audioPath);

//   console.log("==> Generating srt files");
//   await transcribeAudioToSRT(audioPath, `${filePath}final_output.srt`);

//   await addSubtitlesToVideo(
//     outputPath,
//     `${filePath}final_output.srt`,
//     `${filePath}final_output_with_subtitles.mp4`
//   );
//   console.log("==> Merging video and audio");

//   const finalVideoPath = `${filePath}final_output_with_subtitles.mp4`;

//   const { url } = await uploadToS3({
//     filePath: finalVideoPath,
//     name: "final_output_with_subtitles.mp4",
//     userId: userId,
//   });

//   console.log("==> Uploaded video to S3", url);

//   const video = await Video.create({
//     createdBy: userId,
//     videoType: "video",
//     userId,
//     title: body.topic,
//     url: url,
//   });

//   // const script = await generateScript(body.topic);
//   // console.log("==> script", script);

//   // const imageUrl = await generateImage(script.story);
//   // console.log("==> imageUrl", imageUrl);

//   // //   const visualKeywords = await generateVisualKeywords(script!);
//   // //   console.log("==> visualKeywords", visualKeywords);

//   // await generateVideo(script.chapters[0].storyline, filePath + "video.mp4");
//   // //   console.log("==> videoUrl", videoUrl);

//   // await generateAudio(script.chapters[0].storyline, filePath + "audio.mp3");

//   // const videoUrl = await generateVideo(script.chapters[0].storyline, imageUrl!);
//   // console.log("==> videoUrl", videoUrl);

//   // await saveVideo(videoUrl!, filePath + "video.mp4");
//   //   if (!body.topic) {
//   //     return ctx.json({ error: "Topic is required" }, 400);
//   //   }
//   //   console.log("Generating video...");

//   //   return ctx.json({ status: "success", script, visualKeywords: [] });
//   return ctx.json({ status: 200, success: true, data: video }, 200);
// };
