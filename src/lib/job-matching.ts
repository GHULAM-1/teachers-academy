export interface JobRole {
  id: string;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  salaryRange: string;
  requirements: {
    skills: string[];
    workStyle: string[];
    values: string[];
    reskilling: 'low' | 'medium' | 'high';
  };
  resources: {
    dayInLifeVideo?: string;
    searchQuery: string;
    jobBoardLink: string;
    blogPost?: string;
  };
  matchCriteria: {
    skillKeywords: string[];
    valueKeywords: string[];
    workStyleKeywords: string[];
    environmentKeywords: string[];
  };
}

export interface DiscoveryAnswers {
  meaningfulWork?: string;
  workEnvironment?: string;
  praisedSkills?: string;
  workType?: string;
  values?: string;
  trainingOpenness?: string;
  salaryExpectation?: string;
  constraints?: string;
}

export interface JobMatch {
  job: JobRole;
  score: number;
  fitLevel: 'Perfect Fit' | 'Strong Fit' | 'Good Fit';
  reasons: string[];
}

const JOB_ROLES: JobRole[] = [
  {
    id: 'instructional-designer',
    title: 'Instructional Designer',
    shortDescription: 'Design digital learning experiences for schools or companies',
    detailedDescription: 'Instructional designers create educational programs, courses, and training materials for organizations. You\'ll work with subject matter experts to design engaging learning experiences, develop assessments, and use learning management systems. This role combines your teaching expertise with technology and design thinking.',
    salaryRange: '$55K–$80K/year',
    requirements: {
      skills: ['curriculum design', 'technology', 'assessment', 'project management'],
      workStyle: ['independent', 'collaborative', 'structured'],
      values: ['education', 'innovation', 'impact'],
      reskilling: 'medium'
    },
    resources: {
      dayInLifeVideo: 'https://www.youtube.com/results?search_query=instructional+designer+day+in+the+life',
      searchQuery: 'instructional designer careers',
      jobBoardLink: 'https://www.indeed.com/jobs?q=instructional+designer',
      blogPost: 'https://elearningindustry.com/becoming-instructional-designer-complete-guide'
    },
    matchCriteria: {
      skillKeywords: ['curriculum', 'lesson', 'design', 'technology', 'assessment', 'learning', 'education'],
      valueKeywords: ['education', 'helping', 'impact', 'innovation', 'creativity'],
      workStyleKeywords: ['independent', 'project', 'structured', 'organized'],
      environmentKeywords: ['technology', 'digital', 'remote', 'flexible']
    }
  },
  {
    id: 'education-consultant',
    title: 'Education Consultant',
    shortDescription: 'Advise schools, districts, or parents on curriculum and strategy',
    detailedDescription: 'Education consultants provide expert advice to schools, districts, or families on educational strategies, curriculum development, and program improvement. You\'ll leverage your classroom experience to help others solve educational challenges, implement new programs, and improve student outcomes.',
    salaryRange: '$60K–$90K/year',
    requirements: {
      skills: ['communication', 'analysis', 'leadership', 'problem-solving'],
      workStyle: ['independent', 'client-facing', 'flexible'],
      values: ['education', 'leadership', 'impact'],
      reskilling: 'low'
    },
    resources: {
      searchQuery: 'education consultant careers',
      jobBoardLink: 'https://www.indeed.com/jobs?q=education+consultant',
    },
    matchCriteria: {
      skillKeywords: ['leadership', 'communication', 'curriculum', 'strategy', 'analysis', 'problem-solving'],
      valueKeywords: ['education', 'helping', 'leadership', 'impact', 'expertise'],
      workStyleKeywords: ['independent', 'consulting', 'flexible', 'client'],
      environmentKeywords: ['variety', 'travel', 'schools', 'flexible']
    }
  },
  {
    id: 'content-writer-edtech',
    title: 'Content Writer (EdTech)',
    shortDescription: 'Create blog posts, guides, and educational materials for EdTech companies',
    detailedDescription: 'EdTech content writers create educational content for technology companies, including blog posts, curriculum guides, marketing materials, and user documentation. You\'ll combine your educational expertise with writing skills to help EdTech companies communicate effectively with educators and students.',
    salaryRange: '$45K–$70K/year',
    requirements: {
      skills: ['writing', 'research', 'SEO', 'content strategy'],
      workStyle: ['independent', 'remote-friendly', 'deadline-driven'],
      values: ['creativity', 'education', 'flexibility'],
      reskilling: 'medium'
    },
    resources: {
      searchQuery: 'EdTech content writer careers',
      jobBoardLink: 'https://www.indeed.com/jobs?q=content+writer+education',
    },
    matchCriteria: {
      skillKeywords: ['writing', 'communication', 'research', 'creativity', 'technology'],
      valueKeywords: ['creativity', 'education', 'flexibility', 'innovation'],
      workStyleKeywords: ['independent', 'remote', 'flexible', 'creative'],
      environmentKeywords: ['remote', 'technology', 'startup', 'flexible']
    }
  },
  {
    id: 'corporate-trainer',
    title: 'Corporate Trainer',
    shortDescription: 'Train employees in companies on skills, compliance, and professional development',
    detailedDescription: 'Corporate trainers design and deliver training programs for businesses, focusing on employee development, compliance training, and skill building. You\'ll use your teaching skills in a corporate environment, creating workshops, facilitating meetings, and helping employees grow professionally.',
    salaryRange: '$50K–$75K/year',
    requirements: {
      skills: ['presentation', 'facilitation', 'curriculum design', 'assessment'],
      workStyle: ['collaborative', 'structured', 'people-focused'],
      values: ['development', 'impact', 'stability'],
      reskilling: 'low'
    },
    resources: {
      searchQuery: 'corporate trainer careers',
      jobBoardLink: 'https://www.indeed.com/jobs?q=corporate+trainer',
    },
    matchCriteria: {
      skillKeywords: ['training', 'presentation', 'facilitation', 'curriculum', 'teaching'],
      valueKeywords: ['helping', 'development', 'impact', 'stability'],
      workStyleKeywords: ['collaborative', 'structured', 'people', 'presentation'],
      environmentKeywords: ['corporate', 'office', 'structured', 'team']
    }
  },
  {
    id: 'project-coordinator',
    title: 'Project Coordinator (Education Sector)',
    shortDescription: 'Coordinate educational projects, grants, and initiatives',
    detailedDescription: 'Project coordinators in education manage initiatives like curriculum implementation, grant-funded programs, and educational research projects. You\'ll use your organizational skills and education background to ensure projects run smoothly, meet deadlines, and achieve their goals.',
    salaryRange: '$45K–$65K/year',
    requirements: {
      skills: ['organization', 'project management', 'communication', 'attention to detail'],
      workStyle: ['structured', 'collaborative', 'detail-oriented'],
      values: ['organization', 'education', 'stability'],
      reskilling: 'low'
    },
    resources: {
      searchQuery: 'education project coordinator careers',
      jobBoardLink: 'https://www.indeed.com/jobs?q=project+coordinator+education',
    },
    matchCriteria: {
      skillKeywords: ['organization', 'project', 'coordination', 'management', 'planning'],
      valueKeywords: ['organization', 'education', 'stability', 'helping'],
      workStyleKeywords: ['structured', 'organized', 'collaborative', 'detail'],
      environmentKeywords: ['office', 'education', 'structured', 'team']
    }
  },
  {
    id: 'learning-specialist',
    title: 'Learning & Development Specialist',
    shortDescription: 'Design employee learning programs and professional development initiatives',
    detailedDescription: 'L&D specialists create and manage learning programs for organizations, focusing on employee skill development, onboarding, and career growth. You\'ll assess learning needs, design training curricula, and measure the effectiveness of learning initiatives.',
    salaryRange: '$55K–$80K/year',
    requirements: {
      skills: ['curriculum design', 'needs assessment', 'data analysis', 'facilitation'],
      workStyle: ['strategic', 'collaborative', 'data-driven'],
      values: ['development', 'innovation', 'impact'],
      reskilling: 'medium'
    },
    resources: {
      searchQuery: 'learning development specialist careers',
      jobBoardLink: 'https://www.indeed.com/jobs?q=learning+development+specialist',
    },
    matchCriteria: {
      skillKeywords: ['learning', 'development', 'curriculum', 'training', 'assessment'],
      valueKeywords: ['development', 'helping', 'innovation', 'impact'],
      workStyleKeywords: ['strategic', 'collaborative', 'analytical', 'planning'],
      environmentKeywords: ['corporate', 'professional', 'growth', 'innovation']
    }
  }
];

export function matchJobsToAnswers(answers: DiscoveryAnswers): JobMatch[] {
  const matches: JobMatch[] = [];
  
  console.log('🔍 Job Matching Input:', answers);
  const allAnswers = Object.values(answers).filter(Boolean).join(' ').toLowerCase();
  console.log('🔍 Combined Answers:', allAnswers);

  for (const job of JOB_ROLES) {
    let score = 0;
    const reasons: string[] = [];
    
    // Give every job a base score to ensure we have results
    score += 20;

    // Skill matching (30% weight)
    const skillMatches = job.matchCriteria.skillKeywords.filter(keyword => 
      allAnswers.includes(keyword.toLowerCase())
    );
    if (skillMatches.length > 0) {
      score += (skillMatches.length / job.matchCriteria.skillKeywords.length) * 30;
      reasons.push(`Your skills align with ${skillMatches.join(', ')}`);
    }

    // Values matching (25% weight)
    const valueMatches = job.matchCriteria.valueKeywords.filter(keyword => 
      allAnswers.includes(keyword.toLowerCase())
    );
    if (valueMatches.length > 0) {
      score += (valueMatches.length / job.matchCriteria.valueKeywords.length) * 25;
      reasons.push(`Your values match this role's focus on ${valueMatches.join(', ')}`);
    }

    // Work style matching (25% weight)
    const workStyleMatches = job.matchCriteria.workStyleKeywords.filter(keyword => 
      allAnswers.includes(keyword.toLowerCase())
    );
    if (workStyleMatches.length > 0) {
      score += (workStyleMatches.length / job.matchCriteria.workStyleKeywords.length) * 25;
      reasons.push(`Your preferred work style matches this role`);
    }

    // Environment matching (20% weight)
    const environmentMatches = job.matchCriteria.environmentKeywords.filter(keyword => 
      allAnswers.includes(keyword.toLowerCase())
    );
    if (environmentMatches.length > 0) {
      score += (environmentMatches.length / job.matchCriteria.environmentKeywords.length) * 20;
      reasons.push(`The work environment aligns with your preferences`);
    }

    // Salary compatibility
    if (answers.salaryExpectation) {
      const expectedSalary = answers.salaryExpectation.toLowerCase();
      const jobSalary = job.salaryRange.toLowerCase();
      
      // Simple salary matching logic
      if (expectedSalary.includes('50') && (jobSalary.includes('50') || jobSalary.includes('55') || jobSalary.includes('60'))) {
        score += 10;
        reasons.push('Salary expectations align');
      } else if (expectedSalary.includes('60') && (jobSalary.includes('60') || jobSalary.includes('65') || jobSalary.includes('70'))) {
        score += 10;
        reasons.push('Salary expectations align');
      } else if (expectedSalary.includes('70') && (jobSalary.includes('70') || jobSalary.includes('75') || jobSalary.includes('80'))) {
        score += 10;
        reasons.push('Salary expectations align');
      }
    }

    // Reskilling preference
    if (answers.trainingOpenness) {
      const openToTraining = answers.trainingOpenness.toLowerCase();
      if (openToTraining.includes('yes') || openToTraining.includes('open')) {
        score += 5;
      } else if (openToTraining.includes('no') || openToTraining.includes('prefer existing')) {
        if (job.requirements.reskilling === 'low') {
          score += 10;
          reasons.push('Minimal additional training required');
        }
      }
    }

    // Determine fit level
    let fitLevel: 'Perfect Fit' | 'Strong Fit' | 'Good Fit';
    if (score >= 80) fitLevel = 'Perfect Fit';
    else if (score >= 60) fitLevel = 'Strong Fit';
    else fitLevel = 'Good Fit';

    // Include all jobs (we've given them all a base score)
    matches.push({
      job,
      score: Math.round(score),
      fitLevel,
      reasons: reasons.length > 0 ? reasons.slice(0, 3) : ['Good career transition opportunity for teachers']
    });
  }

  // Sort by score and return top 3, but ensure we always have results
  const sortedMatches = matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
    
  console.log('🎯 Final Job Matches:', sortedMatches.map(m => ({ 
    title: m.job.title, 
    score: m.score, 
    fitLevel: m.fitLevel,
    reasons: m.reasons 
  })));
  
  return sortedMatches;
} 