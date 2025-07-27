export interface MindsetTool {
  id: string;
  name: string;
  triggers: string[];
  description: string;
  format: string;
  prompt: string;
}

export const MINDSET_TOOLS: MindsetTool[] = [
  {
    id: 'confidence-check',
    name: 'Confidence Check',
    triggers: [
      "i don't think i'm qualified",
      "others are better",
      "i'm not sure i can do it",
      "i'm not qualified",
      "others are more qualified",
      "i don't have what it takes"
    ],
    description: 'A quick reflection that helps you recognize your transferable skills and past wins.',
    format: '3-question self-assessment',
    prompt: `Let's do a quick confidence check! I'll ask you 3 questions to help you recognize your strengths:

1. What's something you've accomplished in teaching that you're proud of?
2. What skills from teaching would be valuable in your new career?
3. What's one small win you've had recently that shows you can learn and grow?

Take a moment to reflect on each question. Your answers will help you see your true capabilities.`
  },
  {
    id: 'why-not-me',
    name: 'Why Not Me? Journal Prompt',
    triggers: [
      "i'm scared",
      "what if i fail",
      "i'm not ready",
      "i'm afraid",
      "what if i can't do it",
      "i might fail"
    ],
    description: 'A short journaling activity to flip the inner critic into a supporter.',
    format: 'One journal question with an example answer',
    prompt: `Let's flip that inner critic! Here's a journal prompt for you:

**Question:** "Why NOT me? What makes me uniquely qualified for this opportunity?"

**Example answer:** "I have years of experience helping others learn and grow. I've successfully managed classrooms, adapted to different learning styles, and overcome countless challenges. If I can teach complex subjects to diverse students, I can certainly learn new skills for my career transition."

Write your own answer and notice how your perspective shifts!`
  },
  {
    id: 'vision-forward',
    name: 'Vision Forward',
    triggers: [
      "i'm stuck",
      "i don't know what i really want",
      "i'm confused",
      "i'm not sure what i want",
      "i feel lost"
    ],
    description: 'A guided visual exercise to imagine your life one year into your new career path.',
    format: 'Scripted visualization + journal prompt',
    prompt: `Let's create a clear vision of your future! Close your eyes and imagine yourself one year from now in your new career:

**Visualization:** Picture yourself waking up excited about your work. You're using your skills in a new way, making an impact, and feeling fulfilled. What does your day look like? How do you feel? What are you accomplishing?

**Journal Prompt:** "In one year, I want to be [describe your ideal situation]. The steps I'm taking now that will get me there are..."

This vision will guide your decisions and keep you motivated!`
  },
  {
    id: 'small-win-plan',
    name: 'Small Win Plan',
    triggers: [
      "it's overwhelming",
      "i don't know where to start",
      "there's too much to do",
      "i'm overwhelmed",
      "where do i begin"
    ],
    description: 'A tool to break down big transitions into one tiny step that builds momentum.',
    format: 'AI-generated 3-step micro-plan',
    prompt: `Let's break this down into tiny, manageable steps! Here's your 3-step micro-plan:

**Step 1 (This week):** [One small action you can take immediately]
**Step 2 (Next week):** [A slightly bigger step that builds on step 1]
**Step 3 (In 2 weeks):** [Another step that moves you forward]

Remember: Progress is progress, no matter how small. Each step builds momentum and confidence!`
  },
  {
    id: 'permission-slip',
    name: 'Permission Slip',
    triggers: [
      "i feel guilty",
      "i'm afraid to disappoint others",
      "i feel bad leaving teaching",
      "what will others think",
      "i'm letting people down"
    ],
    description: 'A mindset reframing prompt to give yourself permission to grow, change, and prioritize your needs.',
    format: 'Single short message + optional printable',
    prompt: `You have permission to prioritize your growth and happiness! Here's your permission slip:

**"I give myself permission to:**
- Pursue a career that excites and fulfills me
- Take care of my own needs and dreams
- Make changes that serve my highest good
- Trust that my teaching experience has prepared me well
- Believe that I deserve to be happy and successful in my new path"

You don't need anyone else's approval to grow and change. Your journey is valid and important!`
  },
  {
    id: 'impostor-check',
    name: 'Impostor Check',
    triggers: [
      "what if i'm not legit",
      "i don't belong",
      "i'm not good enough",
      "i don't deserve this",
      "i'm a fraud"
    ],
    description: 'A reality-check exercise to dismantle impostor syndrome.',
    format: 'Fill-in-the-blanks prompt + AI encouragement response',
    prompt: `Let's do a reality check! Fill in these blanks:

**"I have successfully [achievement] which proves I can [skill].**
**"I have helped [number] students/people by [specific action]."**
**"My experience in [area] makes me uniquely qualified because [reason]."**

Now read your answers out loud. See? You're not an impostor - you're someone with real experience and valuable skills!`
  },
  {
    id: 'pep-talk',
    name: 'Pep Talk Audio Clip',
    triggers: [
      "i'm about to give up",
      "this is too hard",
      "i want to quit",
      "i can't do this",
      "it's too difficult"
    ],
    description: 'A 90-second recorded message from a coach reminding you of your value and potential.',
    format: 'Audio clip (or AI-generated voice if available)',
    prompt: `I've created a voice recording for you! You can play it below or download it to listen whenever you need motivation.

[This will trigger the TTS functionality to create a personalized pep talk]`
  }
];

export function detectMindsetTriggers(userMessage: string): MindsetTool[] {
  const lowerMessage = userMessage.toLowerCase();
  const triggeredTools: MindsetTool[] = [];
  
  MINDSET_TOOLS.forEach(tool => {
    const hasTrigger = tool.triggers.some(trigger => 
      lowerMessage.includes(trigger.toLowerCase())
    );
    if (hasTrigger) {
      triggeredTools.push(tool);
    }
  });
  
  return triggeredTools;
}

export function getMindsetToolById(id: string): MindsetTool | undefined {
  return MINDSET_TOOLS.find(tool => tool.id === id);
} 