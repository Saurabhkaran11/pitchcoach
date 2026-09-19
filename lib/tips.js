// Event tips shown in the AI panel. Static on purpose: this is presentation advice, it does not need a model call.
export const TIPS = {
  'Hackathon': [
    { title: 'Match the judging criteria', priority: 'high', description: 'Judges score against a rubric. Say the rubric words out loud.', checklist: ['Find the published criteria (innovation, technical, impact, demo)', 'Name each one once in your talk', 'Say which sponsor tech you used and why it is core'] },
    { title: 'Timebox to the second', priority: 'high', description: 'Most slots are 2–3 minutes and they cut you off.', checklist: ['Demo starts before 0:30', 'One slide of context, then show it working', 'Rehearse twice with a timer'] },
    { title: 'Have a backup', priority: 'medium', description: 'Wi-fi and APIs fail on stage.', checklist: ['Record a 60-second screen capture', 'Keep a pre-loaded tab with finished output', 'Know the line you say while switching'] },
    { title: 'Say what you built today', priority: 'medium', description: 'Judges discount anything that looks pre-built.', checklist: ['State what was written during the event', 'Show the commit history if asked'] },
  ],
  'VC Pitch': [
    { title: 'Lead with traction', priority: 'high', description: 'Numbers first. If you have none, lead with the insight and the proof you ran.', checklist: ['One metric that is growing', 'Time period and source for every number', 'No vanity metrics'] },
    { title: 'Prepare investor Q&A', priority: 'high', description: 'The meeting is won in the questions.', checklist: ['Why now?', 'Why you?', 'What is the moat after 18 months?', 'Who pays, how much, how do you reach them?', 'What kills this company?'] },
    { title: 'Make the ask exact', priority: 'high', description: 'Amount, use of funds, milestone it buys.', checklist: ['Round size and instrument', 'Three uses of funds', 'The milestone that unlocks the next round'] },
    { title: 'Keep tech to one slide', priority: 'low', description: 'Investors buy the business. Go deep only when asked.', checklist: ['One architecture slide', 'Appendix for the rest'] },
  ],
  'Product Launch': [
    { title: 'One sentence, one benefit', priority: 'high', description: 'People repeat one line. Choose it for them.', checklist: ['Who it is for', 'What changes for them', 'No feature lists in the headline'] },
    { title: 'Show, then tell', priority: 'high', description: 'A 20-second real use beats three slides.', checklist: ['Start on the finished result', 'Use real data, not lorem ipsum'] },
    { title: 'Clear call to action', priority: 'medium', description: 'Tell them exactly what to do next.', checklist: ['Link on screen for 10+ seconds', 'Price or "free" stated plainly', 'Availability date'] },
  ],
  'College Demo': [
    { title: 'Explain the approach', priority: 'high', description: 'Markers reward reasoning, not polish.', checklist: ['Problem and why it matters', 'Alternatives you considered', 'Why you chose this design'] },
    { title: 'Be honest about limits', priority: 'high', description: 'Naming limitations reads as understanding.', checklist: ['What does not work yet', 'What you would do with more time', 'What you learned'] },
    { title: 'Credit and cite', priority: 'medium', description: 'Libraries, datasets, teammates.', checklist: ['List third-party code and data', 'Say who did what'] },
  ],
};
