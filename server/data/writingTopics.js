/**
 * Graded writing topics aligned to CEFR levels B1 → C2
 */
const writingTopics = {
  B1: [
    {
      id: 'b1-1',
      title: 'My Favourite Place to Visit',
      prompt:
        'Describe your favourite place in your country or city. Explain why you like it, what you usually do there, and why you would recommend it to a friend.',
      wordCount: '150–200 words',
      tips: ['Use descriptive adjectives', 'Include sensory details', 'Explain personal connection'],
      keyVocabulary: ['picturesque', 'tranquil', 'atmosphere', 'memorable', 'stunning'],
    },
    {
      id: 'b1-2',
      title: 'The Importance of Learning a Foreign Language',
      prompt:
        'Why do you think it is important to learn a foreign language? Write about the benefits it brings to your personal and professional life, and give examples from your own experience.',
      wordCount: '150–200 words',
      tips: ['Give at least two clear reasons', 'Use linking words (firstly, moreover, in conclusion)', 'Include a personal example'],
      keyVocabulary: ['communicate', 'culture', 'opportunity', 'improve', 'benefit'],
    },
    {
      id: 'b1-3',
      title: 'A Person Who Inspired Me',
      prompt:
        'Write about someone who has had a big influence on your life. Who are they, what did they do, and how did they change the way you think or act?',
      wordCount: '150–200 words',
      tips: ['Use past simple and present perfect', 'Include specific events/examples', 'Explain impact clearly'],
      keyVocabulary: ['inspire', 'influence', 'admire', 'achieve', 'character'],
    },
  ],

  B2: [
    {
      id: 'b2-1',
      title: 'The Impact of Social Media on Society',
      prompt:
        'Discuss the positive and negative effects of social media on modern society. Consider its influence on communication, mental health, politics, and culture. What changes, if any, would you recommend?',
      wordCount: '220–280 words',
      tips: ['Present both sides of the argument', 'Use hedging language (may, might, it could be argued)', 'Conclude with your own view'],
      keyVocabulary: ['impact', 'influence', 'phenomenon', 'significant', 'contribute'],
    },
    {
      id: 'b2-2',
      title: 'Remote Work: Advantages and Disadvantages',
      prompt:
        'Many people now work from home full-time. Evaluate the advantages and disadvantages of remote working for employees, employers, and society as a whole. Do the benefits outweigh the drawbacks?',
      wordCount: '220–280 words',
      tips: ['Use comparison structures (while, whereas, on the other hand)', 'Support points with evidence or examples', 'State a clear personal position'],
      keyVocabulary: ['productivity', 'flexibility', 'isolation', 'collaboration', 'balance'],
    },
    {
      id: 'b2-3',
      title: 'Technology and Education',
      prompt:
        'To what extent has technology improved the quality of education? Consider arguments for and against increased technology in schools and universities.',
      wordCount: '220–280 words',
      tips: ['Use academic vocabulary', 'Include specific examples of technology', 'Balance your argument'],
      keyVocabulary: ['facilitate', 'accessible', 'demonstrate', 'engage', 'assess'],
    },
  ],

  C1: [
    {
      id: 'c1-1',
      title: 'The Ethics of Artificial Intelligence',
      prompt:
        'Artificial intelligence is reshaping society at an unprecedented pace. Critically examine the ethical implications of AI in areas such as employment, privacy, and decision-making. To what degree should AI development be regulated?',
      wordCount: '280–350 words',
      tips: ['Use complex sentence structures', 'Engage critically rather than just listing points', 'Use hedging and cautious language appropriately'],
      keyVocabulary: ['scrutinise', 'prevalent', 'autonomous', 'paradigm', 'contemplate'],
    },
    {
      id: 'c1-2',
      title: 'Globalisation: Cultural Enrichment or Erosion?',
      prompt:
        'Some argue that globalisation enriches cultures through exchange and diversity, while others claim it threatens indigenous traditions and languages. Develop a nuanced argument, acknowledging the complexity of the issue.',
      wordCount: '280–350 words',
      tips: ['Acknowledge counterarguments explicitly', 'Use nominalisations (e.g. "the erosion of" rather than "eroding")', 'Conclude with an original synthesis'],
      keyVocabulary: ['coherent', 'meticulous', 'arbitrary', 'alleviate', 'elaborate'],
    },
    {
      id: 'c1-3',
      title: 'Is Privacy a Fundamental Human Right in the Digital Age?',
      prompt:
        'Advances in data collection and surveillance raise fundamental questions about privacy. Construct a well-reasoned argument for or against the proposition that privacy is a non-negotiable human right in the 21st century.',
      wordCount: '280–350 words',
      tips: ['Establish clear definitions at the outset', 'Reference abstract concepts with precision', 'Use rhetorical techniques (rhetorical questions, tricolon)'],
      keyVocabulary: ['ambiguous', 'scrutinise', 'paradigm', 'eloquent', 'perceive'],
    },
  ],

  C2: [
    {
      id: 'c2-1',
      title: 'The Limits of Human Knowledge',
      prompt:
        'Drawing on philosophy, science, and your own reasoning, explore the proposition that there are fundamental limits to what human beings can know. Can we ever achieve certainty, or is all knowledge provisional?',
      wordCount: '350–450 words',
      tips: ['Employ sophisticated hedging and epistemic markers', 'Engage with philosophical traditions or thinkers where appropriate', 'Demonstrate range of vocabulary at C2 level'],
      keyVocabulary: ['perspicacious', 'esoteric', 'cogent', 'ineffable', 'paradigm'],
    },
    {
      id: 'c2-2',
      title: 'Language Shapes Thought: A Critical Analysis',
      prompt:
        'The Sapir-Whorf hypothesis suggests that the language we speak shapes the way we think. Critically evaluate this claim, drawing on evidence from linguistics, psychology, and cross-cultural studies.',
      wordCount: '350–450 words',
      tips: ['Demonstrate mastery of academic register', 'Synthesise multiple perspectives', 'Conclude with an original, defensible position'],
      keyVocabulary: ['aberrant', 'amalgamate', 'consternation', 'tenacious', 'iconoclast'],
    },
  ],
};

module.exports = writingTopics;
