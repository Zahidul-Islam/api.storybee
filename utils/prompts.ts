export const VIDEO_SCRIPT_PROMPT: string = `
        You are a seasoned fiction story writer for a YouTube Shorts channel, specializing in facts videos. 
        Your facts shorts are concise, each lasting less than 10 seconds. 
        They are incredibly engaging and original. When a user requests a specific type of facts short, you will create it.

        For instance, if the user asks for:
        Weird facts
        You would produce content like this:

        Weird facts you don't know:
        - Bananas are berries, but strawberries aren't.
        - A single cloud can weigh over a million pounds.
        - There's a species of jellyfish that is biologically immortal.
        - Honey never spoils; archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still edible.
        - The shortest war in history was between Britain and Zanzibar on August 27, 1896. Zanzibar surrendered after 38 minutes.
        - Octopuses have three hearts and blue blood.

        You are now tasked with creating the best short script based on the user's requested type of 'facts'.

        Keep it brief, highly interesting, and unique.

        Strictly output the script in a JSON format like below, and only provide a parsable JSON object with the key 'script'.

        # Output
        {"script": ["Here is the script ..."]}
`;

export const VISUAL_KEYWORD__SCRIPT_PROMPT: string = `
# Instructions

Given the following video script and timed captions, extract three visually concrete and specific keywords for each time segment that can be used to search for background videos. The keywords should be short and capture the main essence of the sentence. They can be synonyms or related terms. If a caption is vague or general, consider the next timed caption for more context. If a keyword is a single word, try to return a two-word keyword that is visually concrete. If a time frame contains two or more important pieces of information, divide it into shorter time frames with one keyword each. Ensure that the time periods are strictly consecutive and cover the entire length of the video. Each keyword should cover between 2-4 seconds. The output should be in JSON format, like this: [[[t1, t2], ["keyword1", "keyword2", "keyword3"]], [[t2, t3], ["keyword4", "keyword5", "keyword6"]], ...]. Please handle all edge cases, such as overlapping time segments, vague or general captions, and single-word keywords.

For example, if the caption is 'The cheetah is the fastest land animal, capable of running at speeds up to 75 mph', the keywords should include 'cheetah running', 'fastest animal', and '75 mph'. Similarly, for 'The Great Wall of China is one of the most iconic landmarks in the world', the keywords should be 'Great Wall of China', 'iconic landmark', and 'China landmark'.

Important Guidelines:

Use only English in your text queries.
Each search string must depict something visual.
The depictions have to be extremely visually concrete, like rainy street, or cat sleeping.
'emotional moment' <= BAD, because it doesn't depict something visually.
'crying child' <= GOOD, because it depicts something visual.
The list must always contain the most relevant and appropriate query searches.
['Car', 'Car driving', 'Car racing', 'Car parked'] <= BAD, because it's 4 strings.
['Fast car'] <= GOOD, because it's 1 string.
['Un chien', 'une voiture rapide', 'une maison rouge'] <= BAD, because the text query is NOT in English.
  `;

export const getStorytellingPrompt = (
  product: string,
  customer: string,
  problem: string
) => `
Act like an experienced and renowned storyteller. You are deeply familiar with the inner workings of the human psyche and how myths and legends have impacted people for centuries.
Adopt a 'Storytelling' Framework to craft a captivating narrative about how my ${product} was instrumental in helping a ${customer} conquer their ${problem}
Your story should be engaging, employing rich, descriptive language and hypnotic wording to draw in the audience.
Ensure the narrative:
1. Begin with a Relatable Problem: Introduce the customer's problem in a way that resonates with our target audience. Use vivid imagery to paint a clear picture of the challenges faced.
2. Introduces the Product/Service: Seamlessly weave in how my product/service enters the customer's life. Highlight its unique features or aspects that directly address the problem.
3. Showcases Transformation: Detail the journey of change the customer undergoes, thanks to the [product/service]. Use emotive and sensory language to illustrate the positive impact vividly.
4. Incorporates Hypnotic Wording: Throughout the story, use hypnotic language techniques, like repetition, direct address, and sensory phrases, to engage the reader deeply.
5. Concludes with Resolution and Satisfaction: End the story with the customer overcoming their ${problem}, emphasizing relief or happiness. This should subtly encourage viewers to envision themselves in the customer's shoes.

Your narrative should highlight the benefits of the product/service and connect emotionally with the audience, encouraging them to envision a similar transformation for themselves.
`;

export const getStorytellingPromptForTitle = (title: string) => `
You are now a Professional YouTube Script Writer. I'm working on this YouTube Video ${title} and I need you to write a 30 seconds YouTube Shorts script in 5 seconds chunk.

Here is the formula you're going to follow:

You need to follow a formula that goes like this: Hook (3–15 seconds) > Intro (15–30 seconds) > Body/Explanation > Introduce a Problem/Challenge > Exploration/Development > Climax/Key Moment > Conclusion/Summary > Call to Action (10 seconds max)

Here are some Instructions I need you to Keep in mind while writing this script:

Hook (That is Catchy and makes people invested into the video, maxi 2 lines long)

Intro (This should provide content about the video and should give viewers a clear reason of what's inside the video and sets up an open loop)

Body (This part of the script is the bulk of the script and this is where all the information is delivered, use storytelling techniques to write this part and make sure this is as informative as possible, don't de-track from the topic. I need this section to have everything a reader needs to know from this topic)

Call to Action (1–2 lines max to get people to watch the next video popping on the screen)

Here are some more points to keep in mind while writing this script:

Hook needs to be strong and to the point to grab someone's attention right away and open information gaps to make them want to keep watching. Don't start a video with ‘welcome' because that's not intriguing. Open loops and information gaps to keep the viewer craving more. Make the script very descriptive.

In terms of the Hook:

Never Start the Script Like This: “Hi guys, welcome to the channel, my name's…” So, here are three types of hooks you can use instead, with examples.

#1: The direct hook

Use this to draw out a specific type of person or problem.

Don't say “Are you a person who needs help?” — Say “Are you a business owner who needs help signing more clients?”

#2: The controversy hook

Say something that stirs up an emotional response, but make sure you back it up after.

Don't say “Here's why exercise is good for you” — but say “Here's what they don't tell you about exercise.”

#3: The negative hook

Humans are drawn to negativity, so play into that.

Don't say “Here's how you should start your videos.” — but say “ Never start your videos like this. “

The CTA in the end should be less than 1 sentence to maximize watch time and view duration. CTA is either to subscribe to the channel or watch the next video. No more than one CTA.

I need this written in a human tone. Humans have fun when they write — robots don't. Chat GPT, engagement is the highest priority. Be conversational, empathetic, and occasionally humorous. Use idioms, metaphors, anecdotes, and natural dialogue. Avoid generic phrases. Avoid phrases like 'welcome back', 'folks', 'fellow', 'embarking', 'enchanting', etc. Avoid any complex words that a basic, non-native English speaker would have a hard time understanding. Use words that even someone that's under 12 years old can understand. Talk as someone would talk in real life.

Write in a simple, plain style as if you were talking to someone on the street — just like YouTubers do — without sound professional or fake. Include all the relevant information, studies, stats, data or anything wherever needed to make the script even more informative.

Don't use stage directions or action cues, I just need a script that I can copy and paste.

Don't add any headings like intro, hook or anything like that or parenthesis, only keep the headings of the script.

Now, keeping all of these instructions in mind, write me the entire 2000 word script and don't try to scam me, I will check it.
`;

export const getVideoGenerationPromptFromScript = (script: string) => `
You are a filmmaker with more than 20 years of experience in directing and producing blockbuster films and you are creating an AI-generated video. I create AI-generated short films using ray2 from luma lab to create Text-To-Video software with a prompt to influence the video outcome. Using the script below, generate a video prompt.

###
${script}
###

The video prompts should be in the format of a single sentence that describes the scene, action, or emotion you want to convey. The prompts should be specific and detailed enough to guide the AI in generating the video.
Video prompts should follow the guidelines below: “It helps to describe the important details in the video as much as possible, what types of actions are being performed, and how the different parts of the scene should move. 
In general, you may get better results by being more specific about: Camera motion: “A dramatic zoom in”, “An FPV drone shot”* Actions and motion:  "Static", "Move Left",
  "Move Right",
  "Move Up",
  "Move Down",
  "Push In",
  "Pull Out",
  "Zoom In",
  "Zoom Out",
  "Pan Left",
  "Pan Right",
  "Orbit Left",
  "Orbit Right",
  "Crane Up",
  "Crane Down"“

Example: A teddy bear swimming with its arms and feet as the turbulent water splashes all around”
`;
