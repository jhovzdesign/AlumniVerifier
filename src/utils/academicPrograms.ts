import type { DegreeBatch } from '../types/index.ts';

export interface AcademicProgramOption {
  name: string;
  degree_level: DegreeBatch;
  college: string;
  defaultMajor?: string;
}

export interface ProgramBatchGroup {
  batch: DegreeBatch;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  programs: AcademicProgramOption[];
}

export const ACADEMIC_PROGRAM_BATCHES: ProgramBatchGroup[] = [
  {
    batch: 'BACHELORS',
    title: "Bachelor's Degree",
    badge: "Undergraduate / Bachelor's",
    badgeColor: "text-blue-800 bg-blue-50 border-blue-200",
    description: "Baccalaureate 4-year degree programs providing comprehensive foundational & specialized collegiate training.",
    programs: [
      {
        name: 'Bachelor of Science in Information Technology',
        degree_level: 'BACHELORS',
        college: 'College of Computing and Information Technology',
        defaultMajor: 'Network & Cloud Systems'
      },
      {
        name: 'Bachelor of Science in Computer Science',
        degree_level: 'BACHELORS',
        college: 'College of Computing and Information Technology',
        defaultMajor: 'Software Engineering'
      },
      {
        name: 'Bachelor of Science in Nursing',
        degree_level: 'BACHELORS',
        college: 'College of Allied Health Sciences',
        defaultMajor: 'Clinical Care Management'
      },
      {
        name: 'Bachelor of Science in Criminology',
        degree_level: 'BACHELORS',
        college: 'College of Criminal Justice Education',
        defaultMajor: 'Forensic Investigation'
      },
      {
        name: 'Bachelor of Secondary Education',
        degree_level: 'BACHELORS',
        college: 'College of Teacher Education',
        defaultMajor: 'English & Literature'
      },
      {
        name: 'Bachelor of Elementary Education',
        degree_level: 'BACHELORS',
        college: 'College of Teacher Education',
        defaultMajor: 'General Curriculum'
      },
      {
        name: 'Bachelor of Science in Business Administration',
        degree_level: 'BACHELORS',
        college: 'College of Business and Accountancy',
        defaultMajor: 'Financial Management'
      },
      {
        name: 'Bachelor of Science in Accountancy',
        degree_level: 'BACHELORS',
        college: 'College of Business and Accountancy',
        defaultMajor: 'Auditing & Assurance'
      },
      {
        name: 'Bachelor of Science in Hospitality Management',
        degree_level: 'BACHELORS',
        college: 'College of Hospitality & Tourism Management',
        defaultMajor: 'Hotel and Restaurant Administration'
      },
      {
        name: 'Bachelor of Science in Civil Engineering',
        degree_level: 'BACHELORS',
        college: 'College of Engineering and Architecture',
        defaultMajor: 'Structural Engineering'
      },
      {
        name: 'Bachelor of Science in Electrical Engineering',
        degree_level: 'BACHELORS',
        college: 'College of Engineering and Architecture',
        defaultMajor: 'Power Systems'
      },
      {
        name: 'Bachelor of Science in Pharmacy',
        degree_level: 'BACHELORS',
        college: 'College of Allied Health Sciences',
        defaultMajor: 'Clinical Pharmacy'
      }
    ]
  },
  {
    batch: 'MASTERS',
    title: "Master's Degree",
    badge: "Graduate / Master's",
    badgeColor: "text-purple-800 bg-purple-50 border-purple-200",
    description: "Advanced post-baccalaureate programs focusing on rigorous professional mastery, research, and leadership.",
    programs: [
      {
        name: 'Master in Information Technology (MIT)',
        degree_level: 'MASTERS',
        college: 'School of Advanced Studies',
        defaultMajor: 'Enterprise Architecture & Cloud Computing'
      },
      {
        name: 'Master in Business Administration (MBA)',
        degree_level: 'MASTERS',
        college: 'School of Advanced Studies',
        defaultMajor: 'Strategic Management & Global Business'
      },
      {
        name: 'Master of Arts in Education (MAEd)',
        degree_level: 'MASTERS',
        college: 'School of Advanced Studies',
        defaultMajor: 'Educational Leadership and Management'
      },
      {
        name: 'Master of Science in Criminal Justice (MSCJ)',
        degree_level: 'MASTERS',
        college: 'School of Advanced Studies',
        defaultMajor: 'Criminology & Security Studies'
      },
      {
        name: 'Master of Science in Nursing (MSN)',
        degree_level: 'MASTERS',
        college: 'School of Advanced Studies',
        defaultMajor: 'Advanced Nursing Administration'
      },
      {
        name: 'Master in Public Administration (MPA)',
        degree_level: 'MASTERS',
        college: 'School of Advanced Studies',
        defaultMajor: 'Public Policy and Local Governance'
      },
      {
        name: 'Master of Science in Management Engineering (MSME)',
        degree_level: 'MASTERS',
        college: 'School of Advanced Studies',
        defaultMajor: 'Operations Research & Quality Systems'
      }
    ]
  },
  {
    batch: 'DOCTORATE',
    title: 'Doctorate Degree',
    badge: 'Post-Graduate / Doctorate',
    badgeColor: "text-amber-900 bg-amber-50 border-amber-300",
    description: "Terminal post-graduate academic degrees emphasizing original scientific contribution, philosophy, and scholarly innovation.",
    programs: [
      {
        name: 'Doctor of Philosophy in Educational Management (Ph.D. EM)',
        degree_level: 'DOCTORATE',
        college: 'School of Advanced Studies',
        defaultMajor: 'Higher Education Governance'
      },
      {
        name: 'Doctor of Business Administration (DBA)',
        degree_level: 'DOCTORATE',
        college: 'School of Advanced Studies',
        defaultMajor: 'Corporate Governance & Innovation'
      },
      {
        name: 'Doctor of Information Technology (DIT)',
        degree_level: 'DOCTORATE',
        college: 'School of Advanced Studies',
        defaultMajor: 'Applied Artificial Intelligence & Systems Theory'
      },
      {
        name: 'Doctor of Philosophy in Criminal Justice (Ph.D. CJ)',
        degree_level: 'DOCTORATE',
        college: 'School of Advanced Studies',
        defaultMajor: 'Public Safety, Law Enforcement & Penology'
      },
      {
        name: 'Doctor of Public Administration (DPA)',
        degree_level: 'DOCTORATE',
        college: 'School of Advanced Studies',
        defaultMajor: 'Development Administration and Public Policy'
      }
    ]
  }
];

export function detectDegreeBatch(programName?: string): DegreeBatch {
  const lower = (programName || '').toLowerCase();
  if (
    lower.includes('doctor') ||
    lower.includes('ph.d') ||
    lower.includes('phd') ||
    lower.includes('dba') ||
    lower.includes('dit') ||
    lower.includes('dpa') ||
    lower.includes('terminal')
  ) {
    return 'DOCTORATE';
  }
  if (
    lower.includes('master') ||
    lower.includes('mba') ||
    lower.includes('maed') ||
    lower.includes('msc') ||
    lower.includes('msn') ||
    lower.includes('mpa') ||
    lower.includes('mit') ||
    lower.includes('post-graduate')
  ) {
    return 'MASTERS';
  }
  return 'BACHELORS';
}

export function getHighestDegree(alumnus: {
  degree_level?: DegreeBatch;
  has_doctorate?: boolean;
  doctorate_program?: string;
  has_masters?: boolean;
  masters_program?: string;
  program?: string;
}): DegreeBatch {
  if (alumnus.has_doctorate && alumnus.doctorate_program?.trim()) {
    return 'DOCTORATE';
  }
  if (alumnus.has_masters && alumnus.masters_program?.trim()) {
    return 'MASTERS';
  }
  if (alumnus.degree_level) {
    return alumnus.degree_level;
  }
  return detectDegreeBatch(alumnus.program);
}

export function getDegreeBatchLabel(batch: DegreeBatch): string {
  switch (batch) {
    case 'DOCTORATE':
      return 'Doctorate Degree';
    case 'MASTERS':
      return "Master's Degree";
    case 'BACHELORS':
    default:
      return "Bachelor's Degree";
  }
}

export function getDegreeBatchBadge(batch: DegreeBatch): { label: string; className: string } {
  switch (batch) {
    case 'DOCTORATE':
      return {
        label: 'Doctorate Degree',
        className: 'text-amber-900 bg-amber-50 border-amber-300 font-bold'
      };
    case 'MASTERS':
      return {
        label: "Master's Degree",
        className: 'text-purple-800 bg-purple-50 border-purple-200 font-bold'
      };
    case 'BACHELORS':
    default:
      return {
        label: "Bachelor's Degree",
        className: 'text-blue-800 bg-blue-50 border-blue-200 font-bold'
      };
  }
}

