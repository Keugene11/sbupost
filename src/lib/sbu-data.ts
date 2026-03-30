export const SBU_MAJORS = [
  "Accounting",
  "Africana Studies",
  "Anthropology",
  "Applied Mathematics & Statistics",
  "Art History & Criticism",
  "Art, Studio",
  "Asian & Asian American Studies",
  "Astronomy/Planetary Sciences",
  "Atmospheric and Oceanic Sciences",
  "Biochemistry",
  "Biology",
  "Biomedical Engineering",
  "Business Management",
  "Chemical & Molecular Engineering",
  "Chemistry",
  "Civil Engineering",
  "Climate Science",
  "Clinical Laboratory Sciences",
  "Coastal Environmental Studies",
  "Communication",
  "Computer Engineering",
  "Computer Science",
  "Creative Writing",
  "Data Science",
  "Earth & Space Sciences",
  "Economics",
  "Education",
  "Electrical Engineering",
  "Engineering Chemistry",
  "Engineering Science",
  "English",
  "Environmental Design, Policy & Planning",
  "Environmental Studies",
  "French Language and Literature",
  "Geology",
  "Globalization Studies & International Relations",
  "Health Science",
  "History",
  "Human Evolutionary Biology",
  "Information Systems",
  "Italian Studies",
  "Journalism",
  "Linguistics",
  "Marine Sciences",
  "Marine Vertebrate Biology",
  "Mass Communication",
  "Mathematics",
  "Mechanical Engineering",
  "Media/Art/Culture",
  "Multidisciplinary Studies",
  "Music",
  "Nursing",
  "Philosophy",
  "Physics",
  "Political Science",
  "Psychology",
  "Respiratory Care",
  "Rhetoric and Writing",
  "Social Work",
  "Sociology",
  "Spanish Language and Literature",
  "Sustainability Studies",
  "Technological Systems Management",
  "Women's and Gender Studies",
]

export const SBU_MINORS = [
  "Africana Studies",
  "Anthropology",
  "Applied Mathematics & Statistics",
  "Art History & Criticism",
  "Art, Studio",
  "Asian & Asian American Studies",
  "Astronomy",
  "Biology",
  "Biomedical Engineering",
  "Business Management",
  "Chemistry",
  "Cinema and Cultural Studies",
  "Communication",
  "Computer Science",
  "Creative Writing",
  "Dance",
  "Data Science",
  "Economics",
  "Education",
  "Electrical Engineering",
  "English",
  "Environmental Studies",
  "European Studies",
  "French",
  "Geology",
  "German",
  "Health & Wellness",
  "History",
  "Information Systems",
  "Italian",
  "Japanese Studies",
  "Journalism",
  "Korean Studies",
  "Linguistics",
  "Marine Sciences",
  "Mathematics",
  "Mechanical Engineering",
  "Music",
  "Philosophy",
  "Physics",
  "Political Science",
  "Psychology",
  "Sociology",
  "Spanish",
  "Sustainability Studies",
  "Theatre Arts",
  "Women's and Gender Studies",
]

export const SBU_COURSE_PREFIXES = [
  "AAS", "ACC", "AMS", "ANT", "ARH", "ARS", "AST", "ATM",
  "BCP", "BIO", "BME", "BUS",
  "CHE", "CHI", "CIV", "CLS", "CME", "COM", "CSE",
  "DAN",
  "EAS", "ECO", "EEL", "EGL", "ESE", "ESG", "ESM", "EST", "ENV",
  "FRN",
  "GEO", "GER", "GLI",
  "HIS", "HON",
  "ISE", "ITL",
  "JPN", "JRN",
  "KOR",
  "LIN",
  "MAE", "MAP", "MAR", "MAT", "MEC", "MUS",
  "NUR",
  "PHI", "PHY", "POL", "PSY",
  "SOC", "SPN", "SUS",
  "THR",
  "WRT", "WST",
]

// Generate common course numbers for autocomplete suggestions
export function generateCourseSuggestions(query: string): string[] {
  const q = query.toUpperCase().trim()
  if (q.length < 2) return []

  // If they typed a prefix, suggest common course numbers
  const matchingPrefixes = SBU_COURSE_PREFIXES.filter((p) => p.startsWith(q))
  if (matchingPrefixes.length > 0 && q.length <= 3) {
    const suggestions: string[] = []
    for (const prefix of matchingPrefixes.slice(0, 5)) {
      suggestions.push(
        `${prefix} 101`, `${prefix} 102`,
        `${prefix} 110`, `${prefix} 114`,
        `${prefix} 200`, `${prefix} 210`,
        `${prefix} 214`, `${prefix} 220`,
        `${prefix} 300`, `${prefix} 301`,
        `${prefix} 310`, `${prefix} 320`,
        `${prefix} 330`, `${prefix} 340`,
        `${prefix} 350`, `${prefix} 360`,
        `${prefix} 373`, `${prefix} 380`,
        `${prefix} 390`, `${prefix} 400`,
      )
    }
    return suggestions
  }

  // If they typed prefix + partial number, filter
  const match = q.match(/^([A-Z]{2,4})\s*(\d{0,3})$/)
  if (match) {
    const [, prefix, num] = match
    if (SBU_COURSE_PREFIXES.includes(prefix)) {
      const numbers = [
        "101", "102", "110", "114", "130", "142",
        "200", "210", "214", "220", "230", "240",
        "300", "301", "310", "312", "316", "320",
        "325", "328", "330", "331", "340", "341",
        "350", "351", "355", "360", "373", "380",
        "390", "391", "394", "400", "416", "421",
        "440", "475", "487", "495", "496", "499",
      ]
      return numbers
        .filter((n) => n.startsWith(num))
        .map((n) => `${prefix} ${n}`)
    }
  }

  return []
}
