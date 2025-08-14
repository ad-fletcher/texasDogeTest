import { tool } from 'ai';
    import { z } from 'zod';
    import { generateObject } from 'ai';
    import { openai } from '@ai-sdk/openai';
    import { supabase } from '../supabase';
    import { DATABASE_SCHEMA_CONTEXT } from '../database/schema-context';

    // ========================================
    // DATABASE OPTIMIZATION REQUIRED
    // ========================================
    // 
    // To fix payee search timeouts, create this optimized RPC function in Supabase:
    //
    // CREATE OR REPLACE FUNCTION search_payees_case_insensitive_limited(
    //   search_term TEXT,
    //   result_limit INTEGER DEFAULT 10
    // )
    // RETURNS TABLE(payee_name TEXT, payee_id TEXT) AS $$
    // BEGIN
    //   RETURN QUERY
    //   SELECT p.payee_name::TEXT, p.payee_id::TEXT
    //   FROM payees p
    //   WHERE p.payee_name ILIKE '%' || search_term || '%'
    //   ORDER BY 
    //     CASE WHEN p.payee_name ILIKE search_term || '%' THEN 1 ELSE 2 END,
    //     LENGTH(p.payee_name),
    //     p.payee_name
    //   LIMIT result_limit;
    // END;
    // $$ LANGUAGE plpgsql;
    //
    // Also create an index for better performance:
    // CREATE INDEX IF NOT EXISTS idx_payees_name_gin ON payees USING gin(payee_name gin_trgm_ops);
    // (Requires: CREATE EXTENSION IF NOT EXISTS pg_trgm;)
    //
    // ========================================
    // EXISTING DATABASE CODE LOOKUP TOOLS
    // ========================================

    // All 193 Texas agencies with their codes - no database calls needed
const TEXAS_AGENCIES = [
  { code: 737, name: "Angelo State University" },
  { code: 302, name: "Attorney General" },
  { code: 520, name: "Board of Examiners of Psychologists" },
  { code: 456, name: "Board of Plumbing Examiners" },
  { code: 758, name: "Board of Regents, Texas State University System" },
  { code: 352, name: "Bond Review Board" },
  { code: 542, name: "Cancer Prevention & Research Institute of Texas" },
  { code: 409, name: "Commission on Jail Standards" },
  { code: 477, name: "Commission on State Emergency Communications" },
  { code: 107, name: "Commission on Uniform State Laws" },
  { code: 304, name: "Comptroller of Public Accounts" },
  { code: 315, name: "Comptroller-Prepaid Higher Education Tuition Board" },
  { code: 907, name: "Comptroller-State Energy Conservation Office" },
  { code: 902, name: "Comptroller-State Fiscal" },
  { code: 311, name: "Comptroller-Treasury Fiscal" },
  { code: 228, name: "Court of Appeals-Eighth Court of Appeals District" },
  { code: 231, name: "Court of Appeals-Eleventh Court of Appeals District" },
  { code: 235, name: "Court of Appeals-Fifteenth Court of Appeals District" },
  { code: 225, name: "Court of Appeals-Fifth Court of Appeals District" },
  { code: 221, name: "Court of Appeals-First Court of Appeals District" },
  { code: 234, name: "Court of Appeals-Fourteenth Court of Appeals District" },
  { code: 224, name: "Court of Appeals-Fourth Court of Appeals District" },
  { code: 229, name: "Court of Appeals-Ninth Court of Appeals District" },
  { code: 222, name: "Court of Appeals-Second Court of Appeals District" },
  { code: 227, name: "Court of Appeals-Seventh Court of Appeals District" },
  { code: 226, name: "Court of Appeals-Sixth Court of Appeals District" },
  { code: 230, name: "Court of Appeals-Tenth Court of Appeals District" },
  { code: 223, name: "Court of Appeals-Third Court of Appeals District" },
  { code: 233, name: "Court of Appeals-Thirteenth Court of Appeals District" },
  { code: 232, name: "Court of Appeals-Twelfth Court of Appeals District" },
  { code: 211, name: "Court of Criminal Appeals" },
  { code: 469, name: "Credit Union Department" },
  { code: 539, name: "Department of Aging and Disability Services" },
  { code: 551, name: "Department of Agriculture" },
  { code: 538, name: "Department of Assistive and Rehabilitative Services" },
  { code: 530, name: "Department of Family and Protective Services" },
  { code: 313, name: "Department of Information Resources" },
  { code: 450, name: "Department of Savings and Mortgage Lending" },
  { code: 537, name: "Department of State Health Services" },
  { code: 241, name: "District Courts-Comptroller's Judiciary Section" },
  { code: 327, name: "Employees Retirement System of Texas" },
  { code: 533, name: "Executive Council of Physical and Occupational Therapy Examiners" },
  { code: 305, name: "General Land Office" },
  { code: 301, name: "Governor-Executive" },
  { code: 300, name: "Governor-Fiscal" },
  { code: 529, name: "Health and Human Services Commission" },
  { code: 364, name: "Health Professions Council" },
  { code: 102, name: "House of Representatives" },
  { code: 789, name: "Lamar Institute of Technology" },
  { code: 787, name: "Lamar State College-Orange" },
  { code: 788, name: "Lamar State College-Port Arthur" },
  { code: 734, name: "Lamar University" },
  { code: 104, name: "Legislative Budget Board" },
  { code: 105, name: "Legislative Reference Library" },
  { code: 735, name: "Midwestern State University" },
  { code: 215, name: "Office of Capital and Forensic Writs" },
  { code: 466, name: "Office of Consumer Credit Commissioner" },
  { code: 212, name: "Office of Court Administration" },
  { code: 448, name: "Office of Injured Employee Counsel" },
  { code: 359, name: "Office of Public Insurance Counsel" },
  { code: 475, name: "Office of Public Utility Counsel" },
  { code: 802, name: "Parks and Wildlife Department" },
  { code: 715, name: "Prairie View A&M University" },
  { code: 704, name: "Public Community/Junior Colleges" },
  { code: 473, name: "Public Utility Commission of Texas" },
  { code: 455, name: "Railroad Commission of Texas" },
  { code: 753, name: "Sam Houston State University" },
  { code: 307, name: "Secretary of State" },
  { code: 101, name: "Senate" },
  { code: 592, name: "Soil and Water Conservation Board" },
  { code: 308, name: "State Auditor" },
  { code: 504, name: "State Board of Dental Examiners" },
  { code: 512, name: "State Board of Podiatric Medical Examiners" },
  { code: 578, name: "State Board of Veterinary Medical Examiners" },
  { code: 242, name: "State Commission on Judicial Conduct" },
  { code: 243, name: "State Law Library" },
  { code: 360, name: "State Office of Administrative Hearings" },
  { code: 479, name: "State Office of Risk Management" },
  { code: 338, name: "State Pension Review Board" },
  { code: 809, name: "State Preservation Board" },
  { code: 213, name: "State Prosecuting Attorney, Office of" },
  { code: 312, name: "State Securities Board" },
  { code: 755, name: "Stephen F. Austin State University" },
  { code: 756, name: "Sul Ross State University" },
  { code: 116, name: "Sunset Advisory Commission" },
  { code: 201, name: "Supreme Court" },
  { code: 713, name: "Tarleton State University" },
  { code: 323, name: "Teacher Retirement System of Texas" },
  { code: 555, name: "Texas A&M AgriLife Extension Service" },
  { code: 556, name: "Texas A&M AgriLife Research" },
  { code: 712, name: "Texas A&M Engineering Experiment Station" },
  { code: 716, name: "Texas A&M Engineering Extension Service" },
  { code: 576, name: "Texas A&M Forest Service" },
  { code: 761, name: "Texas A&M International University" },
  { code: 727, name: "Texas A&M Transportation Institute" },
  { code: 711, name: "Texas A&M University (Main University)" },
  { code: 718, name: "Texas A&M University at Galveston" },
  { code: 710, name: "Texas A&M University System" },
  { code: 709, name: "Texas A&M University System Health Science Center" },
  { code: 770, name: "Texas A&M University-Central Texas" },
  { code: 751, name: "Texas A&M University-Commerce" },
  { code: 760, name: "Texas A&M University-Corpus Christi" },
  { code: 732, name: "Texas A&M University-Kingsville" },
  { code: 749, name: "Texas A&M University-San Antonio" },
  { code: 764, name: "Texas A&M University-Texarkana" },
  { code: 557, name: "Texas A&M Veterinary Medical Diagnostic Laboratory" },
  { code: 458, name: "Texas Alcoholic Beverage Commission" },
  { code: 554, name: "Texas Animal Health Commission" },
  { code: 510, name: "Texas Behavioral Health Executive Council" },
  { code: 459, name: "Texas Board of Architectural Examiners" },
  { code: 508, name: "Texas Board of Chiropractic Examiners" },
  { code: 507, name: "Texas Board of Nursing" },
  { code: 460, name: "Texas Board of Professional Engineers" },
  { code: 481, name: "Texas Board of Professional Geoscientists" },
  { code: 464, name: "Texas Board of Professional Land Surveying" },
  { code: 909, name: "Texas Broadband Development Office" },
  { code: 908, name: "Texas Bullion Depository" },
  { code: 582, name: "Texas Commission on Environmental Quality" },
  { code: 411, name: "Texas Commission on Fire Protection" },
  { code: 407, name: "Texas Commission on Law Enforcement" },
  { code: 813, name: "Texas Commission on the Arts" },
  { code: 451, name: "Texas Department of Banking" },
  { code: 696, name: "Texas Department of Criminal Justice" },
  { code: 332, name: "Texas Department of Housing and Community Affairs" },
  { code: 454, name: "Texas Department of Insurance" },
  { code: 452, name: "Texas Department of Licensing and Regulation" },
  { code: 608, name: "Texas Department of Motor Vehicles" },
  { code: 405, name: "Texas Department of Public Safety" },
  { code: 601, name: "Texas Department of Transportation" },
  { code: 575, name: "Texas Division of Emergency Management" },
  { code: 701, name: "Texas Education Agency" },
  { code: 326, name: "Texas Emergency Services Retirement System" },
  { code: 356, name: "Texas Ethics Commission" },
  { code: 303, name: "Texas Facilities Commission" },
  { code: 513, name: "Texas Funeral Service Commission" },
  { code: 781, name: "Texas Higher Education Coordinating Board" },
  { code: 808, name: "Texas Historical Commission" },
  { code: 644, name: "Texas Juvenile Justice Department" },
  { code: 103, name: "Texas Legislative Council" },
  { code: 362, name: "Texas Lottery Commission" },
  { code: 535, name: "Texas Low-Level Radioactive Waste Disposal Compact Commission" },
  { code: 503, name: "Texas Medical Board" },
  { code: 401, name: "Texas Military Department" },
  { code: 514, name: "Texas Optometry Board" },
  { code: 706, name: "Texas Permanent School Fund Corporation" },
  { code: 347, name: "Texas Public Finance Authority" },
  { code: 476, name: "Texas Racing Commission" },
  { code: 329, name: "Texas Real Estate Commission" },
  { code: 771, name: "Texas School for the Blind and Visually Impaired" },
  { code: 772, name: "Texas School for the Deaf" },
  { code: 717, name: "Texas Southern University" },
  { code: 358, name: "Texas Space Commission" },
  { code: 515, name: "Texas State Board of Pharmacy" },
  { code: 457, name: "Texas State Board of Public Accountancy" },
  { code: 306, name: "Texas State Library and Archives Commission" },
  { code: 719, name: "Texas State Technical College System" },
  { code: 754, name: "Texas State University" },
  { code: 733, name: "Texas Tech University" },
  { code: 739, name: "Texas Tech University Health Sciences Center" },
  { code: 774, name: "Texas Tech University Health Sciences Center - El Paso" },
  { code: 768, name: "Texas Tech University System" },
  { code: 403, name: "Texas Veterans Commission" },
  { code: 580, name: "Texas Water Development Board" },
  { code: 731, name: "Texas Woman's University" },
  { code: 320, name: "Texas Workforce Commission" },
  { code: 930, name: "Treasury Safekeeping Trust Company" },
  { code: 730, name: "University of Houston" },
  { code: 783, name: "University of Houston System" },
  { code: 759, name: "University of Houston-Clear Lake" },
  { code: 784, name: "University of Houston-Downtown" },
  { code: 765, name: "University of Houston-Victoria" },
  { code: 752, name: "University of North Texas" },
  { code: 763, name: "University of North Texas Health Science Center at Fort Worth" },
  { code: 769, name: "University of North Texas System" },
  { code: 773, name: "University of North Texas-Dallas" },
  { code: 714, name: "University of Texas at Arlington" },
  { code: 721, name: "University of Texas at Austin" },
  { code: 747, name: "University of Texas at Brownsville" },
  { code: 738, name: "University of Texas at Dallas" },
  { code: 724, name: "University of Texas at El Paso" },
  { code: 743, name: "University of Texas at San Antonio" },
  { code: 750, name: "University of Texas at Tyler" },
  { code: 785, name: "University of Texas Health Center at Tyler" },
  { code: 744, name: "University of Texas Health Science Center at Houston" },
  { code: 745, name: "University of Texas Health Science Center at San Antonio" },
  { code: 506, name: "University of Texas M.D. Anderson Cancer Center" },
  { code: 723, name: "University of Texas Medical Branch at Galveston" },
  { code: 742, name: "University of Texas of the Permian Basin" },
  { code: 746, name: "University of Texas Rio Grande Valley" },
  { code: 729, name: "University of Texas Southwestern Medical Center" },
  { code: 720, name: "University of Texas System" },
  { code: 736, name: "University of Texas-Pan American" },
  { code: 757, name: "West Texas A&M University" }
];

export const getAgencyCodeTool = tool({
  description: 'Gets the agency code for an agency name. Uses AI to intelligently match user queries to the most relevant Texas agencies from all 193 available agencies.',
  parameters: z.object({
    searchTerm: z.string().describe('The name or description of the agency to search for (can be partial names, abbreviations, or functional descriptions like "education department").'),
  }),
  execute: async ({ searchTerm }) => {
    try {
      // Use AI to intelligently match agencies
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        system: `You are an expert on Texas state government agencies. Your task is to find the most relevant Texas agencies based on user queries.

AVAILABLE TEXAS AGENCIES:
${TEXAS_AGENCIES.map(agency => `${agency.code}: ${agency.name}`).join('\n')}

MATCHING GUIDELINES:
- Understand user intent (e.g., "education" could mean Texas Education Agency, universities, or education boards)
- Handle abbreviations (e.g., "DOT" = Department of Transportation, "DPS" = Department of Public Safety)
- Consider functional descriptions (e.g., "highway department" = Department of Transportation)
- Match partial names intelligently (e.g., "University of Texas" should match all UT system schools)
- Prioritize the most relevant matches
- If only one clear match, return just that one
- If multiple relevant matches, return up to 8 most relevant ones
- If no good matches, suggest the closest alternatives`,

        prompt: `Find the most relevant Texas agencies for: "${searchTerm}"
        
Return the agencies that best match this query, considering:
- Exact name matches
- Functional purpose matches
- Common abbreviations
- Partial name matches
- User intent and context`,

        schema: z.object({
          matches: z.array(z.object({
            code: z.number(),
            name: z.string(),
            relevanceReason: z.string().describe('Brief explanation of why this agency matches the search')
          })),
          searchInterpretation: z.string().describe('How you interpreted the user\'s search intent'),
          confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level in the matches')
        })
      });

      const { matches, searchInterpretation, confidence } = result.object;

      if (matches.length === 0) {
        return { 
          result: `No relevant agencies found for "${searchTerm}". ${searchInterpretation}. Try searching with more specific terms like "University", "Department", "Commission", or specific agency functions.` 
        };
      }

      if (matches.length === 1) {
        const agency = matches[0];
        return { 
          result: `The agency code for ${agency.name} is ${agency.code}. ${agency.relevanceReason}` 
        };
      }

      // Multiple matches
      const agencyList = matches
        .map(agency => `${agency.name} (Code: ${agency.code})`)
        .join(', ');

      const confidenceText = confidence === 'low' ? ' (Note: Low confidence - please verify these matches)' : '';
      
      return { 
        result: `Found ${matches.length} relevant agencies for "${searchTerm}": ${agencyList}. ${searchInterpretation}${confidenceText}` 
      };

    } catch (e) {
      console.error('Error in AI agency search:', e);
      
      // Fallback to simple string matching if AI fails
      const simpleMatches = TEXAS_AGENCIES
        .filter(agency => 
          agency.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 5);

      if (simpleMatches.length > 0) {
        const fallbackList = simpleMatches
          .map(agency => `${agency.name} (Code: ${agency.code})`)
          .join(', ');
        return { 
          result: `AI search unavailable, using fallback search for "${searchTerm}": ${fallbackList}` 
        };
      }

      return { result: `Search temporarily unavailable. Please try again or contact support.` };
    }
  },
});

const APP_FUNDS = [
  {
    "code": 1,
    "name": "0001 - General Revenue Fund"
  },
  {
    "code": 2,
    "name": "0002 - Available School Fund"
  },
  {
    "code": 3,
    "name": "0003 - State Technology Instructional Materials"
  },
  {
    "code": 6,
    "name": "0006 - State Highway Fund"
  },
  {
    "code": 8,
    "name": "0008 - State Highway Debt Service Fund"
  },
  {
    "code": 9,
    "name": "0009 - Gr Account-Game, Fish, Water Safety"
  },
  {
    "code": 10,
    "name": "0010 - Texas Department Of Motor Vehicles Fund"
  },
  {
    "code": 11,
    "name": "0011 - Available University Fund"
  },
  {
    "code": 19,
    "name": "0019 - Gr Acct-Vital Statistics"
  },
  {
    "code": 21,
    "name": "0021 - Proportional Reg Dist Trust Fd"
  },
  {
    "code": 27,
    "name": "0027 - Gr Acct-Coastal Protection"
  },
  {
    "code": 28,
    "name": "0028 - Gr Acct-Appraiser Registry"
  },
  {
    "code": 36,
    "name": "0036 - Gr Acct-Tx Dept Ins Operating"
  },
  {
    "code": 44,
    "name": "0044 - Permanent School Fund"
  },
  {
    "code": 45,
    "name": "0045 - Permanent University Fund"
  },
  {
    "code": 47,
    "name": "0047 - Texas A&M Univ Available Fund"
  },
  {
    "code": 53,
    "name": "0053 - Charter District Bond Guarantee Reserve"
  },
  {
    "code": 57,
    "name": "0057 - County&Road Dist Highway Fund"
  },
  {
    "code": 64,
    "name": "0064 - Gr Acct-State Parks"
  },
  {
    "code": 88,
    "name": "0088 - Gr-Acct Low-Level Radioactive Waste"
  },
  {
    "code": 92,
    "name": "0092 - Gr Acct-Federal Disaster"
  },
  {
    "code": 99,
    "name": "0099 - Gr Acct-Operator/Chaffeur Lic"
  },
  {
    "code": 107,
    "name": "0107 - Gr Acct-Comprehensive Rehabilitation"
  },
  {
    "code": 108,
    "name": "0108 - Gr Acct-Priv Beauty Sch Tuit Prot"
  },
  {
    "code": 116,
    "name": "0116 - Gr Acct-Tx Commission On Law Enforcement"
  },
  {
    "code": 118,
    "name": "0118 - Gr Acct-Fed Pub Library Svc"
  },
  {
    "code": 127,
    "name": "0127 - Gr Acct-Comm Affairs Federal"
  },
  {
    "code": 129,
    "name": "0129 - Gr Acct-Hospital Licensing"
  },
  {
    "code": 146,
    "name": "0146 - Gr Acct-Used Oil Recycling"
  },
  {
    "code": 148,
    "name": "0148 - Gr Acct-Fed Health/Ed/Welfare"
  },
  {
    "code": 151,
    "name": "0151 - Gr Acct-Clean Air"
  },
  {
    "code": 153,
    "name": "0153 - Gr Acct-Water Resource Management"
  },
  {
    "code": 158,
    "name": "0158 - Gr Acct-Watermaster  Admin"
  },
  {
    "code": 161,
    "name": "0161 - Texassure Fund"
  },
  {
    "code": 165,
    "name": "0165 - Gr Acct-Unemp Comp Spec Admin"
  },
  {
    "code": 171,
    "name": "0171 - Gr Acct-Federal School Lunch"
  },
  {
    "code": 174,
    "name": "0174 - Restore Act Federal Fund"
  },
  {
    "code": 175,
    "name": "0175 - Texas Infrastructure Resiliency Fund"
  },
  {
    "code": 176,
    "name": "0176 - Texas Energy Fund"
  },
  {
    "code": 183,
    "name": "0183 - Tx Economic Development Fund"
  },
  {
    "code": 184,
    "name": "0184 - Transportation Infrastructure Fund"
  },
  {
    "code": 186,
    "name": "0186 - Pesticide Disposal Fund"
  },
  {
    "code": 188,
    "name": "0188 - Broadband Pole Replacement Fund"
  },
  {
    "code": 191,
    "name": "0191 - Texas Broadband Infrastructure Fund"
  },
  {
    "code": 193,
    "name": "0193 - Gr Account-Foundation School"
  },
  {
    "code": 194,
    "name": "0194 - Flood Infrastructure Fund"
  },
  {
    "code": 195,
    "name": "0195 - Next Generation 9-1-1 Service Fund"
  },
  {
    "code": 210,
    "name": "0210 - Support Military/Veterans Exemption"
  },
  {
    "code": 211,
    "name": "0211 - Ut Interest & Sinking Fund"
  },
  {
    "code": 212,
    "name": "0212 - Tx A&M Univ Int & Sinking Fund"
  },
  {
    "code": 214,
    "name": "0214 - Available Texas University Fund"
  },
  {
    "code": 221,
    "name": "0221 - Gr Acct-Fed Civ Def/Dis Relief"
  },
  {
    "code": 222,
    "name": "0222 - Gr Acct-Dept Pub Safety Federal"
  },
  {
    "code": 224,
    "name": "0224 - Gr Acct-Governors Ofc Federal Proj"
  },
  {
    "code": 225,
    "name": "0225 - Gr Acct-Univ Of Houston Current"
  },
  {
    "code": 226,
    "name": "0226 - Gr Acct-Univ Of Tex-Pan American Current"
  },
  {
    "code": 227,
    "name": "0227 - Gr Acct-Angelo State Univ Curr"
  },
  {
    "code": 228,
    "name": "0228 - Gr Acct-Univ Of Tex Tyler Curr"
  },
  {
    "code": 229,
    "name": "0229 - Gr Acct-U Of H Clear Lake Curr"
  },
  {
    "code": 230,
    "name": "0230 - Gr Acct-Tx A&M-Corpus Christi Current"
  },
  {
    "code": 231,
    "name": "0231 - Gr Acct-Tx A&M Internatl Univ Curr"
  },
  {
    "code": 232,
    "name": "0232 - Gr Acct-Texas A&M Univ-Texarkana Current"
  },
  {
    "code": 233,
    "name": "0233 - Gr Acct-U Of H Victoria Curr"
  },
  {
    "code": 235,
    "name": "0235 - Gr Acct-Ut Brownsville Curr"
  },
  {
    "code": 236,
    "name": "0236 - Gr Acct-Ut Sys Cancer Ctr Curr"
  },
  {
    "code": 237,
    "name": "0237 - Gr Acct-Tx St Tech Coll Sys Curr"
  },
  {
    "code": 238,
    "name": "0238 - Gr Acct-Univ Texas Dallas Current"
  },
  {
    "code": 239,
    "name": "0239 - Gr Acct-Tx Tech Univ Hsc Current"
  },
  {
    "code": 242,
    "name": "0242 - Gr Acct-Tx A&M Univ Current"
  },
  {
    "code": 243,
    "name": "0243 - Gr Acct-Tarleton St Univ Curr"
  },
  {
    "code": 244,
    "name": "0244 - Gr Acct-Ut Arlington Current"
  },
  {
    "code": 245,
    "name": "0245 - Gr Acct-Prairie View A&M Curr"
  },
  {
    "code": 246,
    "name": "0246 - Gr Acct-Ut Med Br Galv Current"
  },
  {
    "code": 247,
    "name": "0247 - Gr Acct-Tx Southern Univ Curr"
  },
  {
    "code": 248,
    "name": "0248 - Gr Acct-Univ Tx At Austin Curr"
  },
  {
    "code": 249,
    "name": "0249 - Gr Acct-U T San Antonio Current"
  },
  {
    "code": 250,
    "name": "0250 - Gr Acct-Univ Tx El Paso Current"
  },
  {
    "code": 251,
    "name": "0251 - Gr Acct-Ut Permian Basin Curr"
  },
  {
    "code": 252,
    "name": "0252 - Gr Acct-Ut Sw Med Ctr Curr"
  },
  {
    "code": 253,
    "name": "0253 - Gr Acct-Texas Woman'S University Current"
  },
  {
    "code": 254,
    "name": "0254 - Gr Acct-Tx A&M-Kingsville Current"
  },
  {
    "code": 255,
    "name": "0255 - Gr Acct-Tx Tech Univ Current"
  },
  {
    "code": 256,
    "name": "0256 - Gr Acct-Lamar University Current"
  },
  {
    "code": 257,
    "name": "0257 - Gr Acct-Texas A&M Univ-Commerce Current"
  },
  {
    "code": 258,
    "name": "0258 - Gr Acct-University Of North Texas Curren"
  },
  {
    "code": 259,
    "name": "0259 - Gr Acct-Sam Houston St Unv Cur"
  },
  {
    "code": 260,
    "name": "0260 - Gr Acct- Texas State Univ Curr"
  },
  {
    "code": 261,
    "name": "0261 - Gr Acct-Sf Austin St Univ Curr"
  },
  {
    "code": 262,
    "name": "0262 - Gr Acct-Sul Ross St Univ Curr"
  },
  {
    "code": 263,
    "name": "0263 - Gr Acct-West Tex A&M University Current"
  },
  {
    "code": 264,
    "name": "0264 - Gr Acct-Midwestern State University Curr"
  },
  {
    "code": 268,
    "name": "0268 - Gr Acct-U Of H Downtown Current"
  },
  {
    "code": 271,
    "name": "0271 - Gr Acct-Uthsc Houston Current"
  },
  {
    "code": 273,
    "name": "0273 - Gr Acct-Fed Health & Health Lab Funding"
  },
  {
    "code": 275,
    "name": "0275 - Gr Acct-A&M Univ Galv Current"
  },
  {
    "code": 279,
    "name": "0279 - Gr Acct-Uthsc San Antonio Curr"
  },
  {
    "code": 280,
    "name": "0280 - Gr Acct-Univ Of North Texas Hsc Current"
  },
  {
    "code": 282,
    "name": "0282 - Gr Acct-Ut Health Center Tyler Current"
  },
  {
    "code": 285,
    "name": "0285 - Gr Acct-Lamar St Coll Orange Curr"
  },
  {
    "code": 286,
    "name": "0286 - Gr Acct-Lamar St Coll Pt Arthr Curr"
  },
  {
    "code": 287,
    "name": "0287 - Gr Acct-Lamar Inst Of Tech Current"
  },
  {
    "code": 288,
    "name": "0288 - Gr Acct-Unt Sys Law School"
  },
  {
    "code": 289,
    "name": "0289 - Gr Acct-Tx A&M Univ-System Hsc"
  },
  {
    "code": 290,
    "name": "0290 - Gr Acct-Tx A&M Univ-San Antonio Current"
  },
  {
    "code": 291,
    "name": "0291 - Gr Acct-Tx A&M Univ-Central Texas"
  },
  {
    "code": 292,
    "name": "0292 - Gr Acct-Univ Of North Texas-Dallas Curr"
  },
  {
    "code": 293,
    "name": "0293 - Gr Acct-Univ Of Texas Rio Grande Current"
  },
  {
    "code": 294,
    "name": "0294 - Gr Acct-Tx Tech Univ Hsc El Paso Current"
  },
  {
    "code": 301,
    "name": "0301 - Rural Water Assistance Fund"
  },
  {
    "code": 302,
    "name": "0302 - Water Infrastructure Fund"
  },
  {
    "code": 303,
    "name": "0303 - Assistant Prosecutor Supplement Fd"
  },
  {
    "code": 308,
    "name": "0308 - Leaking Water Wells Fund"
  },
  {
    "code": 325,
    "name": "0325 - Coronavirus Relief Fund"
  },
  {
    "code": 326,
    "name": "0326 - Charter School Liquidation Fund"
  },
  {
    "code": 327,
    "name": "0327 - Texas-Bred Incentive Fund"
  },
  {
    "code": 328,
    "name": "0328 - Jury Service Fund"
  },
  {
    "code": 329,
    "name": "0329 - Healthy Tx Small Employer Prem Stab Fund"
  },
  {
    "code": 330,
    "name": "0330 - Floodplain Management Fund"
  },
  {
    "code": 334,
    "name": "0334 - Gr Acct-Comm Of Arts Operating"
  },
  {
    "code": 341,
    "name": "0341 - Gr Acct-Food & Drug Retail Fees"
  },
  {
    "code": 356,
    "name": "0356 - Economicaly Distrs Areas Cl Fd"
  },
  {
    "code": 357,
    "name": "0357 - Economic Distrs Area Cl I&S Fd"
  },
  {
    "code": 358,
    "name": "0358 - Agrig Water Conservation Fd"
  },
  {
    "code": 361,
    "name": "0361 - State Water Implementation"
  },
  {
    "code": 364,
    "name": "0364 - Perm Endow Fd Rurl Com Health Care Invst"
  },
  {
    "code": 365,
    "name": "0365 - Texas Mobility Fund"
  },
  {
    "code": 368,
    "name": "0368 - Fund For Veterans' Assistance"
  },
  {
    "code": 369,
    "name": "0369 - Fed Amer Recovery & Reinvest Act Fd"
  },
  {
    "code": 370,
    "name": "0370 - Tx Water Development Fd Ii Clearance Fd"
  },
  {
    "code": 371,
    "name": "0371 - Tx Water Development Fd Ii"
  },
  {
    "code": 372,
    "name": "0372 - Tx Water Devel Fd Ii Int & Sink Fund"
  },
  {
    "code": 373,
    "name": "0373 - Freestanding Emerg Med Care Fac Lic Fund"
  },
  {
    "code": 374,
    "name": "0374 - Vlb-Veterans Financial Asst Prog Fund"
  },
  {
    "code": 379,
    "name": "0379 - Vet Housing Asst Fdii Ser1994a-1&1994b1"
  },
  {
    "code": 383,
    "name": "0383 - Vet Land Bd-Housing Prog,Tax-Exempt Issu"
  },
  {
    "code": 384,
    "name": "0384 - Vet Land Bd-Housing Prog,Taxable Issues"
  },
  {
    "code": 385,
    "name": "0385 - Vet Land Bd-Land Prog, Tax-Exempt Issues"
  },
  {
    "code": 387,
    "name": "0387 - Texas Opportunity Plan Fund"
  },
  {
    "code": 388,
    "name": "0388 - Tx Coll Student Loan Bond I&S"
  },
  {
    "code": 408,
    "name": "0408 - Texas Park Development Fund"
  },
  {
    "code": 409,
    "name": "0409 - Tx Park Develop Bond I&S Fund"
  },
  {
    "code": 412,
    "name": "0412 - Gr Acct-Midwestern State University Min"
  },
  {
    "code": 421,
    "name": "0421 - Gr Acct-Crim Justice Planning"
  },
  {
    "code": 449,
    "name": "0449 - Gr Acct-Texas Military"
  },
  {
    "code": 450,
    "name": "0450 - Gr Acct-Coastal Pub Ld Mgt Fee"
  },
  {
    "code": 453,
    "name": "0453 - Gr Acct-Disaster Contingency"
  },
  {
    "code": 454,
    "name": "0454 - Gr Acct-Fed Land Reclamation"
  },
  {
    "code": 467,
    "name": "0467 - Gr Acct-Tx Recreation & Parks"
  },
  {
    "code": 468,
    "name": "0468 - Gr Acct-Tceq Occupational License"
  },
  {
    "code": 469,
    "name": "0469 - Gr Acct-Comp To Victims Of Crime"
  },
  {
    "code": 480,
    "name": "0480 - Water Assistance Fund"
  },
  {
    "code": 481,
    "name": "0481 - Water Loan Assistance Fund"
  },
  {
    "code": 483,
    "name": "0483 - Research & Planning Fund"
  },
  {
    "code": 492,
    "name": "0492 - Gr Acct-Bus Enterprise Prog"
  },
  {
    "code": 493,
    "name": "0493 - Endowment Fund For The Blind"
  },
  {
    "code": 494,
    "name": "0494 - Gr Acct-Comp Victims Crime Aux"
  },
  {
    "code": 501,
    "name": "0501 - Gr Acct-Motorcycle Education"
  },
  {
    "code": 506,
    "name": "0506 - Gr Acct-Non-Game/Endanger Spec"
  },
  {
    "code": 507,
    "name": "0507 - Gr Acct-State Lease"
  },
  {
    "code": 512,
    "name": "0512 - Gr Acct-Bureau Of Emergcy Mgt"
  },
  {
    "code": 522,
    "name": "0522 - Veterans Land Program Admin Fd"
  },
  {
    "code": 524,
    "name": "0524 - Gr Acct-Public Health Svcs Fee"
  },
  {
    "code": 529,
    "name": "0529 - Vet Housing Asst Fd-Ser 84a"
  },
  {
    "code": 540,
    "name": "0540 - Gr Acct - Judicial-Court Persnl Train Fd"
  },
  {
    "code": 543,
    "name": "0543 - Gr Acct-Tx Capital Trust"
  },
  {
    "code": 544,
    "name": "0544 - Gr Acct-Lifetime Lic Endowmt"
  },
  {
    "code": 549,
    "name": "0549 - Gr Acct-Waste Management"
  },
  {
    "code": 550,
    "name": "0550 - Gr Acct-Haz & Sol Waste Rem Fees"
  },
  {
    "code": 567,
    "name": "0567 - Vet Housing Asst Fd-Ser 1985"
  },
  {
    "code": 570,
    "name": "0570 - Gr Acct-Fed Surplus Prop Svc Chg"
  },
  {
    "code": 571,
    "name": "0571 - Vet Land Bd 89,90,91,Tax98a&B,99b Refund"
  },
  {
    "code": 573,
    "name": "0573 - Judicial Fund"
  },
  {
    "code": 577,
    "name": "0577 - Tax & Rev Anticipation Note Fd"
  },
  {
    "code": 581,
    "name": "0581 - Gr Acct-B Blackwood Law Enf Mng Inst"
  },
  {
    "code": 588,
    "name": "0588 - Small Business Incubator Fund"
  },
  {
    "code": 589,
    "name": "0589 - Texas Product Development Fund"
  },
  {
    "code": 590,
    "name": "0590 - Vet Housing Asst Bonds Ser 1992"
  },
  {
    "code": 597,
    "name": "0597 - Gr Acct-Tx Racing Commission"
  },
  {
    "code": 599,
    "name": "0599 - Economic Stabilization Fund"
  },
  {
    "code": 601,
    "name": "0601 - Student Loan Auxiliary Fund"
  },
  {
    "code": 626,
    "name": "0626 - Veterans Bond Activity Ser 1989 Fd"
  },
  {
    "code": 655,
    "name": "0655 - Gr Acct-Petrol Store Tnk Remed"
  },
  {
    "code": 664,
    "name": "0664 - Gr Acct-Tx Preservation Trust"
  },
  {
    "code": 679,
    "name": "0679 - Gr Acct-Artificial Reef"
  },
  {
    "code": 683,
    "name": "0683 - Tex Agricultural Fund"
  },
  {
    "code": 733,
    "name": "0733 - Tpfa Master Lease Interest/Sinking Fund"
  },
  {
    "code": 735,
    "name": "0735 - Tpfa Master Lease Project Fund"
  },
  {
    "code": 801,
    "name": "0801 - Glenda Dawson Donate Life Tx Registry"
  },
  {
    "code": 802,
    "name": "0802 - License Plate Trust Fund"
  },
  {
    "code": 804,
    "name": "0804 - Governor'S Mansion Renewal Trust"
  },
  {
    "code": 806,
    "name": "0806 - Spaceport Trust Fund"
  },
  {
    "code": 807,
    "name": "0807 - Child Support Employ Deduct- Offset Acct"
  },
  {
    "code": 808,
    "name": "0808 - County Road Oil And Gas Trust Fund"
  },
  {
    "code": 809,
    "name": "0809 - Ending Homelessness Trust Fund"
  },
  {
    "code": 810,
    "name": "0810 - Permanent Health Fund For Higher Ed"
  },
  {
    "code": 811,
    "name": "0811 - Permanent Endowment Fd Uthsc San Antonio"
  },
  {
    "code": 812,
    "name": "0812 - Perm Endowmt Fd Utmd Anderson Cancer Ctr"
  },
  {
    "code": 813,
    "name": "0813 - Perm Endowmt Fd Utsw Medical Center"
  },
  {
    "code": 814,
    "name": "0814 - Perm Endowmt Fd Ut Med Branch Galveston"
  },
  {
    "code": 815,
    "name": "0815 - Permanent Endowment Fd Uthsc At Houston"
  },
  {
    "code": 816,
    "name": "0816 - Permanent Endowment Fd Uthsc At Tyler"
  },
  {
    "code": 817,
    "name": "0817 - Permanent Endowment Fund Ut At El Paso"
  },
  {
    "code": 818,
    "name": "0818 - Permanent Endowment Fund Tx A&M Hsc"
  },
  {
    "code": 819,
    "name": "0819 - Perm Endowmnt Fd U Of N Tex Hsc Ft Worth"
  },
  {
    "code": 820,
    "name": "0820 - Perm Endowment Fd Tx Tech Hsc El Paso"
  },
  {
    "code": 821,
    "name": "0821 - Perm Endowment Fd Tx Tech Hsc All Other"
  },
  {
    "code": 822,
    "name": "0822 - Perm Endowmnt Fd Ut Reg Acad Health Ctr"
  },
  {
    "code": 823,
    "name": "0823 - Perm Endowmnt Fd Baylor Coll Med (Thecb)"
  },
  {
    "code": 824,
    "name": "0824 - Perm Fd Hied Nursing/Allied/Other Health"
  },
  {
    "code": 825,
    "name": "0825 - Perm Fd Minority Hlth Research/Education"
  },
  {
    "code": 829,
    "name": "0829 - Private Driving School Security Trust Fd"
  },
  {
    "code": 830,
    "name": "0830 - Events Trust Fd For Certain Muni/Countys"
  },
  {
    "code": 831,
    "name": "0831 - Dept Of Sav&Mtg Lend Local Oper Trust Fd"
  },
  {
    "code": 838,
    "name": "0838 - Binding Arbitration Trust Fund"
  },
  {
    "code": 839,
    "name": "0839 - Motor Sports And Racing Trust Fund"
  },
  {
    "code": 842,
    "name": "0842 - Tx Tomorrow Fnd Ii Undergrad Educ Tr Fnd"
  },
  {
    "code": 844,
    "name": "0844 - Twc Obligation Trust Fund"
  },
  {
    "code": 847,
    "name": "0847 - Special Olympics Texas Trust Fund"
  },
  {
    "code": 849,
    "name": "0849 - Bob Bullock Tx St His Museum Local Tr Fd"
  },
  {
    "code": 851,
    "name": "0851 - Ofc Consumr Crdt Comm Local Op Trst Fnd"
  },
  {
    "code": 854,
    "name": "0854 - Capital Renewal Trust Fund"
  },
  {
    "code": 855,
    "name": "0855 - Tex School Emp Uniform Grp Cov Tr Fd"
  },
  {
    "code": 858,
    "name": "0858 - Bd Of Pub Accountancy Local Opr Trust Fd"
  },
  {
    "code": 864,
    "name": "0864 - 403b Administrative Trust Fund, Trs"
  },
  {
    "code": 869,
    "name": "0869 - Major Events Reimbursement Program"
  },
  {
    "code": 872,
    "name": "0872 - Tobacco Settlemt Perm Trust (Pol Subdiv)"
  },
  {
    "code": 873,
    "name": "0873 - Glo Purch/Lease Land Vacancy Tr Fd"
  },
  {
    "code": 874,
    "name": "0874 - Local Tax Coll-Sport/Comm Venue Trust Fd"
  },
  {
    "code": 875,
    "name": "0875 - Emerg Svs Fee On Wireless Telecom Tr Fnd"
  },
  {
    "code": 876,
    "name": "0876 - Horse Industry Escrow Trust Account"
  },
  {
    "code": 878,
    "name": "0878 - Texas Save And Match Trust Fund"
  },
  {
    "code": 879,
    "name": "0879 - Capitol Local Trust Fund"
  },
  {
    "code": 882,
    "name": "0882 - City, County, Mta & Spd Sales Tax Trust"
  },
  {
    "code": 885,
    "name": "0885 - State Parks Endowment Trust Account"
  },
  {
    "code": 886,
    "name": "0886 - Internat'L Fuels Tax Agreement Trust Fd"
  },
  {
    "code": 888,
    "name": "0888 - Ers Investment Pool Trust Fund"
  },
  {
    "code": 889,
    "name": "0889 - Tx Real Estate Comm Local Oper Trust Fnd"
  },
  {
    "code": 892,
    "name": "0892 - Tx Tomorrow Constitutional Trust Fd"
  },
  {
    "code": 894,
    "name": "0894 - Twc Wage Determination Trust Fd"
  },
  {
    "code": 896,
    "name": "0896 - Tx Housing Local Depository Fd"
  },
  {
    "code": 898,
    "name": "0898 - Auction Ed & Recovery Trust Fund"
  },
  {
    "code": 899,
    "name": "0899 - Txdot Local Proj. Disbursing Trust Fund"
  },
  {
    "code": 900,
    "name": "0900 - Departmental Suspense"
  },
  {
    "code": 902,
    "name": "0902 - State Cemetery Preservation Trust"
  },
  {
    "code": 903,
    "name": "0903 - Flood Area School/Road Tr Acct"
  },
  {
    "code": 905,
    "name": "0905 - Qualified Hotel Project Trust Fund"
  },
  {
    "code": 907,
    "name": "0907 - Texas Able Savings Plan Trust Fund"
  },
  {
    "code": 925,
    "name": "0925 - Career School/College Tuition Trust Acct"
  },
  {
    "code": 927,
    "name": "0927 - Co/Polsubdv/Locgov Ro/Airpt Tr Acct"
  },
  {
    "code": 930,
    "name": "0930 - Restore Act Trust Fund"
  },
  {
    "code": 936,
    "name": "0936 - Unemployment Comp Clear Acct"
  },
  {
    "code": 937,
    "name": "0937 - Unemployment Comp Benefit Acct"
  },
  {
    "code": 938,
    "name": "0938 - Unemployment Trust-Fed Treas"
  },
  {
    "code": 940,
    "name": "0940 - Mtr Vehicle Proof Resp Tr Acct"
  },
  {
    "code": 941,
    "name": "0941 - Varner Hogg State Park Tr Acct"
  },
  {
    "code": 943,
    "name": "0943 - St Emp Cafeteria Plan Tr Fd"
  },
  {
    "code": 945,
    "name": "0945 - Def Compensation Trust Fd, Ers"
  },
  {
    "code": 946,
    "name": "0946 - Texasaver Trust Fund"
  },
  {
    "code": 955,
    "name": "0955 - S.E.R.S. Trust Account"
  },
  {
    "code": 960,
    "name": "0960 - Trs Trust Account"
  },
  {
    "code": 973,
    "name": "0973 - Employee Ins Benefit Trust Acct"
  },
  {
    "code": 974,
    "name": "0974 - Produce Recovery Trust Fund"
  },
  {
    "code": 976,
    "name": "0976 - Tx Emergency Services Retirement Tr Fd"
  },
  {
    "code": 977,
    "name": "0977 - Law Enf/Cust Off Supp Retmt Fd"
  },
  {
    "code": 984,
    "name": "0984 - Parolee Restitution Trust Fund"
  },
  {
    "code": 989,
    "name": "0989 - Retired School Emp Grp Ins Trust Fund"
  },
  {
    "code": 993,
    "name": "0993 - Jud Ret Sys-Plan Two Trust Fd"
  },
  {
    "code": 994,
    "name": "0994 - Child Support Trust Fund"
  },
  {
    "code": 1004,
    "name": "1004 - Treasury Safekeep Trust Local Oper Fund"
  },
  {
    "code": 1005,
    "name": "1005 - Tx Real Estate Comm Local Operating Fund"
  },
  {
    "code": 1006,
    "name": "1006 - Tx Dept Of Ins Local Operating Fund"
  },
  {
    "code": 1007,
    "name": "1007 - Dept Of Sav&Mtg Lend Local Oper Fund"
  },
  {
    "code": 1008,
    "name": "1008 - Tx Dept Of Banking Local Operating Fund"
  },
  {
    "code": 1009,
    "name": "1009 - Tx St Board Of Public Acct Local Oper Fd"
  },
  {
    "code": 1010,
    "name": "1010 - Bd Of Architect Examiners Local Oper Fd"
  },
  {
    "code": 1011,
    "name": "1011 - Bd Of Prof Engineers Local Operating Fd"
  },
  {
    "code": 1012,
    "name": "1012 - Office Of Consumer Cr Comm Local Oper Fd"
  },
  {
    "code": 1013,
    "name": "1013 - Credit Union Department Local Oper Fd"
  },
  {
    "code": 1014,
    "name": "1014 - Tx State University System Local Oper Fd"
  },
  {
    "code": 1017,
    "name": "1017 - Historical Commission Retail Oper Fund"
  },
  {
    "code": 1201,
    "name": "1201 - Texas Emissions Reduction Plan Trust"
  },
  {
    "code": 1202,
    "name": "1202 - Opioid Abatement Local Operating Trust"
  },
  {
    "code": 1203,
    "name": "1203 - Space Exploration/Aeronautics Trust Fund"
  },
  {
    "code": 1204,
    "name": "1204 - Historic Infrastructure Sustain Trust"
  },
  {
    "code": 5000,
    "name": "5000 - Gr Acct - Solid Waste Disposal Fees"
  },
  {
    "code": 5003,
    "name": "5003 - Gr Acct-Hotel Occ Tax For Economic Devel"
  },
  {
    "code": 5004,
    "name": "5004 - Gr Acct-Pks/ Wildlife Conserv Atn/Capt'L"
  },
  {
    "code": 5005,
    "name": "5005 - Gr Acct - Oil Overcharge"
  },
  {
    "code": 5006,
    "name": "5006 - Gr Acct - Ag Law Enforcement"
  },
  {
    "code": 5007,
    "name": "5007 - Gr Acct Comm On State Emergency Comm"
  },
  {
    "code": 5010,
    "name": "5010 - Gr Acct - Sexual Assault Program"
  },
  {
    "code": 5012,
    "name": "5012 - Gr Acct - Crime Stoppers Assistance"
  },
  {
    "code": 5013,
    "name": "5013 - Gr Acct - Breath Alcohol Testing"
  },
  {
    "code": 5017,
    "name": "5017 - Gr Acct-Asbestos Removal Licensure"
  },
  {
    "code": 5018,
    "name": "5018 - Gr Acct - Home Health Services"
  },
  {
    "code": 5020,
    "name": "5020 - Gr Acct-Workplace Chemicals List"
  },
  {
    "code": 5021,
    "name": "5021 - Gr Acct-Cert Of Mammography Systems"
  },
  {
    "code": 5022,
    "name": "5022 - Gr Acct - Oysters Sales"
  },
  {
    "code": 5023,
    "name": "5023 - Gr Acct - Shrimp License Buy Back"
  },
  {
    "code": 5024,
    "name": "5024 - Gr Acct-Food & Drug Registration"
  },
  {
    "code": 5025,
    "name": "5025 - Gr Acct-Lottery"
  },
  {
    "code": 5026,
    "name": "5026 - Gr Acct-Workforce Commission Federal"
  },
  {
    "code": 5029,
    "name": "5029 - Gr Acct-Ctr Study/Prev Juv Crime & Delin"
  },
  {
    "code": 5031,
    "name": "5031 - Gr Acct-Excess Benefit Arrangement,Trs"
  },
  {
    "code": 5037,
    "name": "5037 - Gr Acct-Sex Assault Prev/Crisis Svcs"
  },
  {
    "code": 5040,
    "name": "5040 - Gr Acct-Tobacco Settlement"
  },
  {
    "code": 5041,
    "name": "5041 - Gr Acct-Railroad Commission Federal"
  },
  {
    "code": 5043,
    "name": "5043 - Gr Acct-Business Enterprise Prog Trust"
  },
  {
    "code": 5044,
    "name": "5044 - Gr Acct-Perm Fd Health/Tobacco Ed/Enforc"
  },
  {
    "code": 5045,
    "name": "5045 - Gr Acct-Perm Fd Children & Public Health"
  },
  {
    "code": 5046,
    "name": "5046 - Gr Acct-Perm Fd For Ems And Trauma Care"
  },
  {
    "code": 5047,
    "name": "5047 - Gr Acct-Perm Fd Rural Health Fac Cap Imp"
  },
  {
    "code": 5048,
    "name": "5048 - Gr Acct-Perm Hosp Cptl Imp/Ctr Infec Dis"
  },
  {
    "code": 5049,
    "name": "5049 - Gr Acct-St Owned Multicat Teaching Hosp"
  },
  {
    "code": 5050,
    "name": "5050 - Gr Acct-911 Service Fees"
  },
  {
    "code": 5051,
    "name": "5051 - Gr Acct-Go Texan Partner Program"
  },
  {
    "code": 5059,
    "name": "5059 - Gr Acct - Peace Officer Flag"
  },
  {
    "code": 5060,
    "name": "5060 - Gr Acct-Private Sector Prison Industries"
  },
  {
    "code": 5064,
    "name": "5064 - Gr Acct - Volunteer Fire Dept Assistance"
  },
  {
    "code": 5065,
    "name": "5065 - Gr Acct - Environmental Trst Lab Accredi"
  },
  {
    "code": 5066,
    "name": "5066 - Gr Acct-Rural Volunteer Fire Dept Insura"
  },
  {
    "code": 5071,
    "name": "5071 - Gr Acct-Emissions Reduction Plan"
  },
  {
    "code": 5073,
    "name": "5073 - Gr Acct-Fair Defense"
  },
  {
    "code": 5081,
    "name": "5081 - Gr Acct-Barber School Tuition Protection"
  },
  {
    "code": 5083,
    "name": "5083 - Gr Acct-Corr Mngmt Inst & Crim Justice C"
  },
  {
    "code": 5084,
    "name": "5084 - Gr Acct-Child Abuse Neglect/Prev Oper"
  },
  {
    "code": 5091,
    "name": "5091 - Gr Acct-Orca Federal"
  },
  {
    "code": 5093,
    "name": "5093 - Gr Acct - Dry Cleaner Facility Release"
  },
  {
    "code": 5094,
    "name": "5094 - Gr Acct - Operating Permit Fees"
  },
  {
    "code": 5095,
    "name": "5095 - Gr Acct - Election Improvement"
  },
  {
    "code": 5096,
    "name": "5096 - Gr Acct - Perpetual Care"
  },
  {
    "code": 5100,
    "name": "5100 - Gr Acct - System Benefit"
  },
  {
    "code": 5101,
    "name": "5101 - Gr Acct - Subsequent Injury"
  },
  {
    "code": 5103,
    "name": "5103 - Gr Acct - Texas B-On-Time Student Loan"
  },
  {
    "code": 5105,
    "name": "5105 - Gr Acct - Public Assurance"
  },
  {
    "code": 5106,
    "name": "5106 - Gr Acct - Economic Dev Bank"
  },
  {
    "code": 5107,
    "name": "5107 - Gr Acct - Texas Enterprise"
  },
  {
    "code": 5108,
    "name": "5108 - Gr Acct - Ems, Trauma Fac, Trauma Sys"
  },
  {
    "code": 5111,
    "name": "5111 - Gr Acct - Trauma Facility & Ems"
  },
  {
    "code": 5124,
    "name": "5124 - Gr Acct - Texas Emerging Technology"
  },
  {
    "code": 5125,
    "name": "5125 - Gr Acct - Childhood Immunization"
  },
  {
    "code": 5128,
    "name": "5128 - Gr Acct-Emp And Training Invest Holding"
  },
  {
    "code": 5135,
    "name": "5135 - Gr Acct - Educator Excellence Innovation"
  },
  {
    "code": 5136,
    "name": "5136 - Gr Acct - Cancer Prevention And Research"
  },
  {
    "code": 5139,
    "name": "5139 - Gr Acct - Historic Site"
  },
  {
    "code": 5140,
    "name": "5140 - Gr Acct-Specialty License Plates General"
  },
  {
    "code": 5143,
    "name": "5143 - Gr Account -Jobs & Educ For Texans (Jet)"
  },
  {
    "code": 5144,
    "name": "5144 - Gr Acct - Physician Educ Loan Repmt Prog"
  },
  {
    "code": 5147,
    "name": "5147 - Gr Account - Texas Physician Health Prog"
  },
  {
    "code": 5149,
    "name": "5149 - Gr Acct-Bp Oil Spill Tx Response Grant"
  },
  {
    "code": 5150,
    "name": "5150 - Gr Acct-Large Count & Munic Rec & Parks"
  },
  {
    "code": 5151,
    "name": "5151 - Gr Acct-Lw-Lvl Radioact Waste Disp Cpt C"
  },
  {
    "code": 5152,
    "name": "5152 - Gr Acct - Alamo Complex"
  },
  {
    "code": 5153,
    "name": "5153 - Gr Acct-Emergency Radio Infrastructure"
  },
  {
    "code": 5155,
    "name": "5155 - Gr Acct - Oil And Gas Regult And Cleanup"
  },
  {
    "code": 5157,
    "name": "5157 - Gr Acct-Statewide Electronic Filing Sys"
  },
  {
    "code": 5158,
    "name": "5158 - Gr Acct-Environ Radiation Perpetual Care"
  },
  {
    "code": 5160,
    "name": "5160 - Gr Acct-Disabled Veterans Local Gov Asst"
  },
  {
    "code": 5161,
    "name": "5161 - Gr-Acct Governor'S Univ Research Initive"
  },
  {
    "code": 5164,
    "name": "5164 - Gr Acct-Youth Diversion"
  },
  {
    "code": 5166,
    "name": "5166 - Gr Acct-Deferred Maintenance"
  },
  {
    "code": 5167,
    "name": "5167 - Gr Acct-Ship Channel Improvement Revolv"
  },
  {
    "code": 5170,
    "name": "5170 - Gr Acct-Evidence Testing"
  },
  {
    "code": 5172,
    "name": "5172 - Gr Acct-Prisoner Safety"
  },
  {
    "code": 5173,
    "name": "5173 - Gr Acct - Tx Forensic Science Commission"
  },
  {
    "code": 5174,
    "name": "5174 - Gr Acct-Drug Court"
  },
  {
    "code": 5175,
    "name": "5175 - Gr Acct-Bingo Administration"
  },
  {
    "code": 5176,
    "name": "5176 - Gr Acct - Coastal Erosion Response"
  },
  {
    "code": 5177,
    "name": "5177 - Gr Acct - Identification Fee Exemption"
  },
  {
    "code": 5178,
    "name": "5178 - Gr Acct - State Hemp Program"
  },
  {
    "code": 5180,
    "name": "5180 - Gr Account - Strategic Mapping"
  },
  {
    "code": 5181,
    "name": "5181 - Gr Acct - Disaster Recovery Loan"
  },
  {
    "code": 5183,
    "name": "5183 - Gr Acct - Newborn Screening Preservation"
  },
  {
    "code": 5184,
    "name": "5184 - Gr Account - Specialty Court"
  },
  {
    "code": 5185,
    "name": "5185 - Gr Acct - Dna Testing"
  },
  {
    "code": 5186,
    "name": "5186 - Gr Acct - Transportation Admin Fee"
  },
  {
    "code": 5187,
    "name": "5187 - Gr Acct - Broadband Development"
  },
  {
    "code": 5189,
    "name": "5189 - Gr Acct-Opioid Abatement"
  },
  {
    "code": 5192,
    "name": "5192 - Gr Acct-Barbrng&Cosmetgy Sch Tuit Prtect"
  },
  {
    "code": 5193,
    "name": "5193 - Gr Acct-Texas Music Incubator"
  },
  {
    "code": 5198,
    "name": "5198 - Gr Acct Lonestar Workforce Of The Future"
  },
  {
    "code": 5199,
    "name": "5199 - Gr Acct - Port Access"
  },
  {
    "code": 5200,
    "name": "5200 - Gr Acct Statewide Water Public Awareness"
  },
  {
    "code": 7022,
    "name": "7022 - Tpfa Go Ser2007a-1 Tmpc Int & Sink Fd"
  },
  {
    "code": 7023,
    "name": "7023 - Tpfa Go Ser 2006a Refund Int & Sink Fd"
  },
  {
    "code": 7024,
    "name": "7024 - Tpfa Go Ser 2006b Refund Int & Sink Fd"
  },
  {
    "code": 7027,
    "name": "7027 - Tpfa Go Ser 2007b Tmpc Int & Sink Fd"
  },
  {
    "code": 7030,
    "name": "7030 - Tpfa Go Ser2007 Tdcj&Tfc Inter & Sink Fd"
  },
  {
    "code": 7031,
    "name": "7031 - Tpfa Go Ser2008 Refunding Int & Sink Fnd"
  },
  {
    "code": 7033,
    "name": "7033 - Tpfa Go Coml Paper Ser 2008 Int&Sink Fnd"
  },
  {
    "code": 7035,
    "name": "7035 - Tpfa Go Coml Paper Series 2008 Rebate Fd"
  },
  {
    "code": 7039,
    "name": "7039 - Tpfa Go Ser2008a Refunding Int & Sink Fs"
  },
  {
    "code": 7040,
    "name": "7040 - Tpfa Go Ser2009b Interest & Sinking Fund"
  },
  {
    "code": 7042,
    "name": "7042 - Tpfa Go Coml Paper Ser A&B Int&Sink Fund"
  },
  {
    "code": 7045,
    "name": "7045 - Tpfa Go Ser2009a Refunding Int & Sink Fd"
  },
  {
    "code": 7048,
    "name": "7048 - Tpfa Go Ser2010 Refunding Int & Sink Fnd"
  },
  {
    "code": 7049,
    "name": "7049 - Tpfa Go Ser 2011 Refund Int & Sink Fnd"
  },
  {
    "code": 7051,
    "name": "7051 - Tpfa Go Taxable Ser 2011 Refund I&S Fd"
  },
  {
    "code": 7053,
    "name": "7053 - Tpfa Go Ser 2013 Refund Int & Sink Fnd"
  },
  {
    "code": 7056,
    "name": "7056 - Tpfa Go Ser 2014a Refund Intrst&Sinking"
  },
  {
    "code": 7058,
    "name": "7058 - Tpfa Go Tax Ser 2014b Refund Intrst&Sink"
  },
  {
    "code": 7059,
    "name": "7059 - Tpfa Go Ser 2015a Refund Intrst&Sinking"
  },
  {
    "code": 7060,
    "name": "7060 - Tpfa Go Ser 2015a Refund Cost Of Issue"
  },
  {
    "code": 7061,
    "name": "7061 - Tpfa Go Ser 2015c Refund Intrst&Sinking"
  },
  {
    "code": 7062,
    "name": "7062 - Tpfa Go Ser 2015c Refund Cost Of Issue"
  },
  {
    "code": 7063,
    "name": "7063 - Tpfa Go Series 2016 Int & Sinking Fund"
  },
  {
    "code": 7064,
    "name": "7064 - Tpfa Go Series 2016 Cost Of Issue Fund"
  },
  {
    "code": 7065,
    "name": "7065 - Tpfa Go Series 2016 Int & Sink Fund Tmpc"
  },
  {
    "code": 7066,
    "name": "7066 - Tpfa Go Series 2016 Cst Of Iss Fund Tmpc"
  },
  {
    "code": 7067,
    "name": "7067 - Tpfa Go & Ref (Cprit), 2017 Int & Sink"
  },
  {
    "code": 7068,
    "name": "7068 - Tpfa Go & Ref (Cprit), 2017 Cost Of Iss"
  },
  {
    "code": 7069,
    "name": "7069 - Tpfa Go Ref. Series 2017a, Int & Sinking"
  },
  {
    "code": 7070,
    "name": "7070 - Tpfa Go Ref. Series 2017a, Cost Of Issue"
  },
  {
    "code": 7071,
    "name": "7071 - Tpfa Go Series 2017b, Int & Sinking"
  },
  {
    "code": 7072,
    "name": "7072 - Tpfa Go Series 2017b, Cost Of Issue"
  },
  {
    "code": 7073,
    "name": "7073 - Tpfa Go & Ref (Cprit), 2018 Int & Sink"
  },
  {
    "code": 7074,
    "name": "7074 - Tpfa Go & Ref (Cprit), 2018 Cost Issue"
  },
  {
    "code": 7075,
    "name": "7075 - Tpfa Go Ref. Series 2018a, Int & Sinking"
  },
  {
    "code": 7076,
    "name": "7076 - Tpfa Go Ref. Series 2018a, Cost Of Issue"
  },
  {
    "code": 7077,
    "name": "7077 - Tpfa Go & Ref Bonds Txbl Series 2020 I&S"
  },
  {
    "code": 7078,
    "name": "7078 - Tpfa Go & Ref Bonds Txbl Series 2020 Coi"
  },
  {
    "code": 7079,
    "name": "7079 - Tpfa Go & Ref Bond Txbl Series 2021a I&S"
  },
  {
    "code": 7080,
    "name": "7080 - Tpfa Go & Ref Bond Txbl Series 2021a Coi"
  },
  {
    "code": 7081,
    "name": "7081 - Tpfa Go & Ref Bond Txbl Series 2021b I&S"
  },
  {
    "code": 7082,
    "name": "7082 - Tpfa Go & Ref Bond Txbl Series 2021b Coi"
  },
  {
    "code": 7083,
    "name": "7083 - Tpfa Go & Ref Bond Txbl Series 2023 I&S"
  },
  {
    "code": 7084,
    "name": "7084 - Tpfa Go & Ref Bond Txbl Series 2023 Coi"
  },
  {
    "code": 7085,
    "name": "7085 - Tpfa Go & Ref Bond Txbl 2023a Cprit I&S"
  },
  {
    "code": 7086,
    "name": "7086 - Tpfa Go & Ref Bond Txbl 2023a Cprit Coi"
  },
  {
    "code": 7201,
    "name": "7201 - Tpfa Go Ser 2002a Coml Paper Tdh Proj A"
  },
  {
    "code": 7207,
    "name": "7207 - Tpfa Go Series 2007 Tfc Project Fund"
  },
  {
    "code": 7211,
    "name": "7211 - Tpfa Go Series 2009b Dps Project Fund"
  },
  {
    "code": 7212,
    "name": "7212 - Tpfa Go Series 2009b Dshs Project Fund"
  },
  {
    "code": 7213,
    "name": "7213 - Tpfa Go Series 2009b Thc Project Fund"
  },
  {
    "code": 7215,
    "name": "7215 - Tpfa Go Ser2011 Refundg Dshs Project Fd"
  },
  {
    "code": 7217,
    "name": "7217 - Tpfa Go Ser2011 Refundg Tfc Project Fd"
  },
  {
    "code": 7330,
    "name": "7330 - Tpfa Rev Ser 2006 Thc Int & Sink Fd"
  },
  {
    "code": 7339,
    "name": "7339 - Tpfa Rev Ref Series 2008 Tfc Int&Sink Fd"
  },
  {
    "code": 7342,
    "name": "7342 - Tpfa Rev Refund Ser2015a Tfc I&S Fund"
  },
  {
    "code": 7343,
    "name": "7343 - Tpfa Rev Refund Ser2015a Tfc Coi Fund"
  },
  {
    "code": 7344,
    "name": "7344 - Tpfa Rev Refund Ser2015b Tmd I&S Fund"
  },
  {
    "code": 7345,
    "name": "7345 - Tpfa Rev Refund Ser2015b Tmd Coi Fund"
  },
  {
    "code": 7346,
    "name": "7346 - Tpfa Rev Refund Ser2015c Pres Bd I&S Fnd"
  },
  {
    "code": 7347,
    "name": "7347 - Tpfa Rev Refund Ser2015c Pres Bd Coi Fnd"
  },
  {
    "code": 7348,
    "name": "7348 - Tpfa Rev Refund Ser2015d Tpwd I&S Fund"
  },
  {
    "code": 7349,
    "name": "7349 - Tpfa Rev Refund Ser2015d Tpwd Coi Fund"
  },
  {
    "code": 7350,
    "name": "7350 - Tpfa Rev Refund Ser2015e Dshs I&S Fund"
  },
  {
    "code": 7351,
    "name": "7351 - Tpfa Rev Refund Ser2015e Dshs Coi Fund"
  },
  {
    "code": 7352,
    "name": "7352 - Tpfa Rv Com Pap Srs 16 Tfc Int & Sink Fd"
  },
  {
    "code": 7353,
    "name": "7353 - Tpfa Rv Com Pap Srs 16 Tfc Cst Of Iss Fd"
  },
  {
    "code": 7354,
    "name": "7354 - Tpfa Rev Refund Series 2017 Thc I&S Fund"
  },
  {
    "code": 7355,
    "name": "7355 - Tpfa Rev Refund Series 2017 Thc Coi Fund"
  },
  {
    "code": 7356,
    "name": "7356 - Tpfa Lease Rev&Ref (Tfc) T/E I&S Funds"
  },
  {
    "code": 7357,
    "name": "7357 - Leaserev&Ref Bonds(Tfc) Ser2019 Coi Fund"
  },
  {
    "code": 7359,
    "name": "7359 - Tpfa Lease Rev&Ref Txbl Ser2020 Tfc Coi"
  },
  {
    "code": 7360,
    "name": "7360 - Tpfa Lease Rev&Ref Txbl Ser2020 Tfc I&S"
  },
  {
    "code": 7361,
    "name": "7361 - Tpfa Lease Rev Txbl Ser2021 Txdot Coi"
  },
  {
    "code": 7362,
    "name": "7362 - Tpfa Lease Rev Txbl Ser2021 Txdot I&S"
  },
  {
    "code": 7364,
    "name": "7364 - Tpfa Lease Rev Ref Ser2024 Tfc Coi"
  },
  {
    "code": 7516,
    "name": "7516 - Lease Rev&Ref Bonds (Tfc) T/E Proj Fund"
  },
  {
    "code": 7517,
    "name": "7517 - Tpfa Rev Txbl Ser2021 Txdot Proj"
  },
  {
    "code": 7604,
    "name": "7604 - Tpfa Go Ser2002b Coml Pap Colonia Prj Fd"
  },
  {
    "code": 7618,
    "name": "7618 - Tpfa Go Ser2002a Coml Paper Dps Prj B Fd"
  },
  {
    "code": 7629,
    "name": "7629 - Tpfa Go Coml Paper Ser2008 Dps Prj 1a Fd"
  },
  {
    "code": 7632,
    "name": "7632 - Tpfa Go Coml Papr Ser2002a Thc Prj B Fnd"
  },
  {
    "code": 7633,
    "name": "7633 - Tpfa Go Coml Papr Ser2008 Tfc Prj 1a Fnd"
  },
  {
    "code": 7634,
    "name": "7634 - Tpfa Go Coml Papr Ser2002a Tpwd Prj C Fd"
  },
  {
    "code": 7635,
    "name": "7635 - Tpfa Go Coml Papr Ser2008 Tpwd Prj 1a Fd"
  },
  {
    "code": 7636,
    "name": "7636 - Tpfa Go Comml Papr Ser2008thc Prj 1a Fnd"
  },
  {
    "code": 7637,
    "name": "7637 - Tpfa Go Coml Papr Ser2008 Tyc Prj 1a Fnd"
  },
  {
    "code": 7638,
    "name": "7638 - Tpfa Go Coml Papr Ser2008 Adj Gen Prj 1a"
  },
  {
    "code": 7639,
    "name": "7639 - Tpfa Cprit Project Fund"
  },
  {
    "code": 7640,
    "name": "7640 - Tpfa Go Coml Papr Ser 2002a Tfc Prj C Fd"
  },
  {
    "code": 7641,
    "name": "7641 - Tpfa Go Coml Papr Ser 2008 Tfc Prj 1b Fd"
  },
  {
    "code": 7644,
    "name": "7644 - Tpfa Go Coml Papr Ser2008 Dads Prj 1b Fd"
  },
  {
    "code": 7645,
    "name": "7645 - Tpfa Go Coml Papr Ser2008 Tyc Prj 1b Fd"
  },
  {
    "code": 7646,
    "name": "7646 - Tpfa Go Coml Papr Ser2008 Thc Prj 1b Fd"
  },
  {
    "code": 7647,
    "name": "7647 - Tpfa Go Coml Papr Ser2008 Tpwd Prj 1b Fd"
  },
  {
    "code": 7648,
    "name": "7648 - Tpfa Go Coml Papr Ser2008 Dps Proj 1b Fd"
  },
  {
    "code": 7649,
    "name": "7649 - Tpfa Go Cml Ppr Ser2008 Adj Gen Pj 1b Fd"
  },
  {
    "code": 7650,
    "name": "7650 - Tpfa Go Cml Paper Ser2008 Thc Proj 1c Fd"
  },
  {
    "code": 7651,
    "name": "7651 - Tpfa Go Cml Paper Ser2008 Dshs Prj 1c Fd"
  },
  {
    "code": 7652,
    "name": "7652 - Tpfa Go Cml Paper Ser2008 Tfc Proj 1c Fd"
  },
  {
    "code": 7654,
    "name": "7654 - Tpfa Go Cml Papr Ser2008 Tpwd Proj 1c Fd"
  },
  {
    "code": 7655,
    "name": "7655 - Tpfa Go Cml Papr Ser2008 Tdcj Proj 1d Fd"
  },
  {
    "code": 7656,
    "name": "7656 - Tpfa Go Cml Papr Ser2008 Dps Proj 1c Fd"
  },
  {
    "code": 7657,
    "name": "7657 - Tpfa Go Cml Paper Ser2008 Tfc Proj 1d Fd"
  },
  {
    "code": 7658,
    "name": "7658 - Tpfa Go Cml Paper Ser2008 Dads Prj 1b Fd"
  },
  {
    "code": 7659,
    "name": "7659 - Tpfa Go Cml Papr Ser2008 Tpwd Proj 1d Fd"
  },
  {
    "code": 7660,
    "name": "7660 - Tpfa Go Cml Paper Ser2008 Dshs Prj 1d Fd"
  },
  {
    "code": 7661,
    "name": "7661 - Tpfa Go Cml Paper Ser2008 Tmd Prj 1c Fd"
  },
  {
    "code": 7662,
    "name": "7662 - Tpfa Go Cml Paper Ser2008 Thc Proj 1d Fd"
  },
  {
    "code": 7663,
    "name": "7663 - Tpfa Go Coml Papr Ser2008 Tjjd Prj 1c Fd"
  },
  {
    "code": 7800,
    "name": "7800 - Tpfa Rv Com Pap Srs 16 Tfc Project Fund"
  },
  {
    "code": 7802,
    "name": "7802 - Tpfa Rv Com Pap Srs 2019a Hhsc Def Maint"
  },
  {
    "code": 7805,
    "name": "7805 - Tpfa Rv Com Pap Srs 2019a Camp Hubbard"
  }
]

export const getApplicationFundCodeTool = tool({
  description: 'Gets the application fund code for a fund name. Uses AI to intelligently match user queries to the most relevant Texas application funds from all available funds.',
  parameters: z.object({
    searchTerm: z.string().describe('The name or description of the application fund to search for (can be partial names or functional descriptions like "general revenue" or "tobacco").'),
  }),
  execute: async ({ searchTerm }) => {
    try {
      // Use AI to intelligently match application funds
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        system: `You are an expert on Texas government application funds. Your task is to find the most relevant application funds based on user queries.

AVAILABLE TEXAS APPLICATION FUNDS:
${APP_FUNDS.map(fund => `${fund.code}: ${fund.name}`).join('\n')}

MATCHING GUIDELINES:
- Understand user intent and functional purpose of funds
- Handle partial names intelligently (e.g., "general revenue" matches "General Revenue Fund")
- Consider fund purposes (e.g., "tobacco" matches tobacco-related funds, "education" matches education funds)
- Match common abbreviations and keywords
- Prioritize the most relevant matches
- If only one clear match, return just that one
- If multiple relevant matches, return up to 8 most relevant ones
- Consider fund numbers and names together for better matching`,

        prompt: `Find the most relevant Texas application funds for: "${searchTerm}"
        
Return the funds that best match this query, considering:
- Exact name matches
- Functional purpose matches
- Partial name matches
- Fund purpose and context
- User intent`,

        schema: z.object({
          matches: z.array(z.object({
            code: z.number(),
            name: z.string(),
            relevanceReason: z.string().describe('Brief explanation of why this fund matches the search')
          })),
          searchInterpretation: z.string().describe('How you interpreted the user\'s search intent'),
          confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level in the matches')
        })
      });

      const { matches, searchInterpretation, confidence } = result.object;

      if (matches.length === 0) {
        return { 
          result: `No relevant application funds found for "${searchTerm}". ${searchInterpretation}. Try searching with terms like "general revenue", "tobacco", "education", or specific fund purposes.` 
        };
      }

      if (matches.length === 1) {
        const fund = matches[0];
        return { 
          result: `The application fund code for ${fund.name} is ${fund.code}. ${fund.relevanceReason}` 
        };
      }

      // Multiple matches
      const fundList = matches
        .map(fund => `${fund.name} (Code: ${fund.code})`)
        .join(', ');

      const confidenceText = confidence === 'low' ? ' (Note: Low confidence - please verify these matches)' : '';
      
      return { 
        result: `Found ${matches.length} relevant application funds for "${searchTerm}": ${fundList}. ${searchInterpretation}${confidenceText}` 
      };

    } catch (e) {
      console.error('Error in AI application fund search:', e);
      
      // Fallback to simple string matching if AI fails
      const simpleMatches = APP_FUNDS
        .filter(fund => 
          fund.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 8);

      if (simpleMatches.length > 0) {
        const fallbackList = simpleMatches
          .map(fund => `${fund.name} (Code: ${fund.code})`)
          .join(', ');
        return { 
          result: `AI search unavailable, using fallback search for "${searchTerm}": ${fallbackList}` 
        };
      }

      return { result: `Search temporarily unavailable. Please try again or contact support.` };
    }
  },
});



// All 21 Texas spending categories with their codes - no database calls needed
const TEXAS_CATEGORIES = [
  { code: 13, name: "Capital Outlay" },
  { code: 17, name: "Claims And Judgments" },
  { code: 15, name: "Communications And Utilities" },
  { code: 18, name: "Cost Of Goods Sold" },
  { code: 11, name: "Debt Service – Interest" },
  { code: 10, name: "Debt Service – Principal" },
  { code: 2, name: "Employee Benefits" },
  { code: 12, name: "Highway Construction" },
  { code: 0, name: "Interfund Transfers/Other" },
  { code: 6, name: "Intergovernmental Payments" },
  { code: 20, name: "Investments" },
  { code: 7, name: "Lottery Winnings Paid" },
  { code: 4, name: "Other Expenditures" },
  { code: 19, name: "Printing And Reproduction" },
  { code: 9, name: "Professional Service And Fees" },
  { code: 5, name: "Public Assistance Payments" },
  { code: 16, name: "Rentals And Leases" },
  { code: 14, name: "Repairs And Maintenance" },
  { code: 1, name: "Salaries And Wages" },
  { code: 3, name: "Supplies And Materials" },
  { code: 8, name: "Travel" }
];

export const getCategoryCodeTool = tool({
  description: 'Gets the category code for a spending category. Uses AI to intelligently match user queries to the most relevant Texas spending categories from all 21 available categories.',
  parameters: z.object({
    searchTerm: z.string().describe('The name or description of the spending category to search for (can be partial names or functional descriptions like "employee pay" or "construction").'),
  }),
  execute: async ({ searchTerm }) => {
    try {
      // Use AI to intelligently match categories
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        system: `You are an expert on Texas government spending categories. Your task is to find the most relevant spending categories based on user queries.

AVAILABLE TEXAS SPENDING CATEGORIES:
${TEXAS_CATEGORIES.map(category => `${category.code}: ${category.name}`).join('\n')}

CATEGORY DESCRIPTIONS & MATCHING GUIDELINES:
- Capital Outlay: Large purchases, equipment, infrastructure, buildings
- Claims And Judgments: Legal settlements, court judgments, liability payments
- Communications And Utilities: Phone, internet, electricity, water, utilities
- Cost Of Goods Sold: Direct costs of goods/services provided
- Debt Service – Interest: Interest payments on government debt
- Debt Service – Principal: Principal payments on government debt
- Employee Benefits: Health insurance, retirement, benefits (not salaries)
- Highway Construction: Road building, highway projects, transportation infrastructure
- Interfund Transfers/Other: Internal government transfers, miscellaneous
- Intergovernmental Payments: Payments between government entities
- Investments: Investment activities, financial instruments
- Lottery Winnings Paid: Lottery prize payments
- Other Expenditures: General operational costs, miscellaneous expenses
- Printing And Reproduction: Printing services, document reproduction
- Professional Service And Fees: Consulting, legal, professional services
- Public Assistance Payments: Welfare, social services, assistance programs
- Rentals And Leases: Equipment rental, facility leases, rental payments
- Repairs And Maintenance: Maintenance costs, repairs, upkeep
- Salaries And Wages: Employee salaries, wages, payroll (not benefits)
- Supplies And Materials: Office supplies, materials, consumables
- Travel: Travel expenses, transportation, lodging

MATCHING GUIDELINES:
- Understand user intent (e.g., "employee pay" = Salaries And Wages, "benefits" = Employee Benefits)
- Handle common terms (e.g., "construction" = Highway Construction or Capital Outlay)
- Consider functional descriptions (e.g., "utilities" = Communications And Utilities)
- Match partial names intelligently
- If multiple relevant matches, return up to 5 most relevant ones
- If only one clear match, return just that one`,

        prompt: `Find the most relevant Texas spending categories for: "${searchTerm}"
        
Return the categories that best match this query, considering:
- Exact name matches
- Functional purpose matches
- Common spending terms
- User intent and context`,

        schema: z.object({
          matches: z.array(z.object({
            code: z.number(),
            name: z.string(),
            relevanceReason: z.string().describe('Brief explanation of why this category matches the search')
          })),
          searchInterpretation: z.string().describe('How you interpreted the user\'s search intent'),
          confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level in the matches')
        })
      });

      const { matches, searchInterpretation, confidence } = result.object;

      if (matches.length === 0) {
        return { 
          result: `No relevant categories found for "${searchTerm}". ${searchInterpretation}. Try searching with terms like "salaries", "construction", "benefits", "supplies", or "travel or look in the Comptroller Codes".` 
        };
      }

      if (matches.length === 1) {
        const category = matches[0];
        return { 
          result: `The category code for ${category.name} is ${category.code}. ${category.relevanceReason}` 
        };
      }

      // Multiple matches
      const categoryList = matches
        .map(category => `${category.name} (Code: ${category.code})`)
        .join(', ');

      const confidenceText = confidence === 'low' ? ' (Note: Low confidence - please verify these matches)' : '';
      
      return { 
        result: `Found ${matches.length} relevant categories for "${searchTerm}": ${categoryList}. ${searchInterpretation}${confidenceText}` 
      };

    } catch (e) {
      console.error('Error in AI category search:', e);
      
      // Fallback to simple string matching if AI fails
      const simpleMatches = TEXAS_CATEGORIES
        .filter(category => 
          category.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 5);

      if (simpleMatches.length > 0) {
        const fallbackList = simpleMatches
          .map(category => `${category.name} (Code: ${category.code})`)
          .join(', ');
        return { 
          result: `AI search unavailable, using fallback search for "${searchTerm}": ${fallbackList}` 
        };
      }

      return { result: `Search temporarily unavailable. Please try again or contact support.` };
    }
  },
});


// Payee Code Tool with Timeout Handling
export const getPayeeCodeTool = tool({
  description: 'Get the payee ID for a payee name. Uses fuzzy search to return payees from the database with timeout protection.',
  parameters: z.object({
    searchTerm: z.string().describe('The name of the payee to search for.'),
    limit: z.number().default(10).describe('Maximum number of results to return (default: 10)')
  }),
  execute: async ({ searchTerm, limit = 10 }) => {
    try {
      // Add timeout protection with Promise.race
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout - payee database is large, try a more specific search term')), 8000)
      );

      const searchPromise = supabase.rpc('search_payees_case_insensitive_limited', {
        search_term: searchTerm,
        result_limit: limit
      });

      const result = await Promise.race([searchPromise, timeoutPromise]);
      const { data, error } = result as { 
        data: Array<{ payee_name: string; payee_id: string }> | null; 
        error: { code?: string; message?: string } | null 
      };

      if (error) {
        console.error('Supabase RPC error:', error);
        
        // If the specific RPC doesn't exist, fall back to a simpler query
        if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
          console.log('Falling back to basic payee search...');
          return await executeBasicPayeeSearch(searchTerm, limit);
        }
        
        return { result: `Error: Database query timeout. Try a more specific payee name (e.g., first few letters or exact company name).` };
      }

      if (!data || data.length === 0) {
        return { result: `No payee found for "${searchTerm}". Try a partial name or check spelling.` };
      }

      if (data.length === 1) {
        const item = data[0];
        return { result: `The payee ID for ${item.payee_name} is ${item.payee_id}.` };
      }

      const payeeList = data
        .slice(0, limit) // Ensure we don't exceed the limit
        .map(
          (item: { payee_name: string; payee_id: string }) =>
            `${item.payee_name} (ID: ${item.payee_id})`,
        )
        .join(', ');

      const moreResultsText = data.length >= limit ? ` (showing first ${limit} results - be more specific for fewer results)` : '';
      return { result: `Found multiple possible payees for "${searchTerm}": ${payeeList}${moreResultsText}.` };
      
    } catch (e) {
      console.error('Error executing payee tool:', e);
      
      if (e instanceof Error && e.message.includes('timeout')) {
        return { result: `Search timeout: The payees database is very large. Try a more specific search term (e.g., "DELL" instead of "D" or "UNIVERSITY OF TEXAS" instead of "UNIVERSITY").` };
      }
      
      // Fall back to basic search if main search fails
      console.log('Attempting fallback search...');
      return await executeBasicPayeeSearch(searchTerm, limit);
    }
  },
});
 
// Fallback function for basic payee search
async function executeBasicPayeeSearch(searchTerm: string, limit: number = 10) {
  try {
    // Use a direct SQL query with ILIKE for simple fuzzy search
    // Table has 2.2M records, so we need to be very selective
    const { data, error } = await supabase
      .from('payeeCodes') // Correct table name from schema
      .select('Payee_Name, Payee_id') // Correct column names
      .ilike('Payee_Name', `%${searchTerm}%`)
      .limit(limit);

    if (error) {
      console.error('Basic payee search error:', error);
      return { result: `Error: Unable to search payees. Please try a different search term.` };
    }

    if (!data || data.length === 0) {
      return { result: `No payee found for "${searchTerm}" in basic search. Try a shorter, simpler search term.` };
    }

    if (data.length === 1) {
      const item = data[0];
      return { result: `The payee ID for ${item.Payee_Name} is ${item.Payee_id}.` };
    }

    const payeeList = data
      .map(
        (item: { Payee_Name: string; Payee_id: string }) =>
          `${item.Payee_Name} (ID: ${item.Payee_id})`,
      )
      .join(', ');

    return { result: `Found multiple payees for "${searchTerm}": ${payeeList}.` };
    
  } catch (e) {
    console.error('Basic payee search failed:', e);
    return { result: `Unable to search payees. The database may be experiencing issues.` };
  }
}



const COMPTROLLER_CODES = [
  {
    "code": 7001,
    "name": "Salaries and Wages -  Line Item Exempt Positions"
  },
  {
    "code": 7002,
    "name": "Salaries and Wages -  Classified and Non-Classified Permanent Full-Time Employees"
  },
  {
    "code": 7003,
    "name": "Salaries and Wages -  Classified and Non-Classified Permanent Part-Time Employees"
  },
  {
    "code": 7004,
    "name": "Salaries and Wages -  Classified and Non-Classified Non-Permanent Full-Time Employees"
  },
  {
    "code": 7005,
    "name": "Salaries and Wages -  Classified and Non-Classified Non-Permanent Part-Time Employees"
  },
  {
    "code": 7006,
    "name": "Salaries and Wages -  Hourly Full-Time Employees"
  },
  {
    "code": 7007,
    "name": "Salaries and Wages -  Hourly Part-Time Employees"
  },
  {
    "code": 7008,
    "name": "Higher Education Salaries -  Faculty/Academic Employees"
  },
  {
    "code": 7009,
    "name": "Higher Education Salaries -  Faculty/Academic Equivalent Employees"
  },
  {
    "code": 7010,
    "name": "Higher Education Salaries -  Professional/Administrative Employees"
  },
  {
    "code": 7011,
    "name": "Higher Education Salaries -  Extension- Professional/ Administrative Employees"
  },
  {
    "code": 7012,
    "name": "Higher Ed Sal/Class Fulltime"
  },
  {
    "code": 7013,
    "name": "Higher Ed Sal/Class Partime"
  },
  {
    "code": 7014,
    "name": "Higher Education Salaries -  Student Employees"
  },
  {
    "code": 7015,
    "name": "Higher Education Salaries -  Classified Employees"
  },
  {
    "code": 7016,
    "name": "Salaries and Wages -  Employees Receiving Twice-A-Month Salary Payment"
  },
  {
    "code": 7017,
    "name": "One-Time Merit Increase"
  },
  {
    "code": 7018,
    "name": "Hardship Stations Pay"
  },
  {
    "code": 7019,
    "name": "Compensatory Time Pay"
  },
  {
    "code": 7020,
    "name": "Hazardous Duty Pay"
  },
  {
    "code": 7021,
    "name": "Overtime Pay"
  },
  {
    "code": 7022,
    "name": "Longevity Pay"
  },
  {
    "code": 7023,
    "name": "Lump Sum Termination Payment"
  },
  {
    "code": 7024,
    "name": "Termination Pay -  Death Benefits"
  },
  {
    "code": 7025,
    "name": "Compensatory or Salary Per Diem"
  },
  {
    "code": 7028,
    "name": "Productivity Bonus Awards"
  },
  {
    "code": 7030,
    "name": "Employee Incentive Bonus"
  },
  {
    "code": 7031,
    "name": "Emoluments and Allowances"
  },
  {
    "code": 7032,
    "name": "Employees Retirement -  State Contribution"
  },
  {
    "code": 7033,
    "name": "Employee Retirement - Other Employment Expenses"
  },
  {
    "code": 7035,
    "name": "Stipend Pay"
  },
  {
    "code": 7037,
    "name": "Incentive Award for Authorized Service to Veterans"
  },
  {
    "code": 7040,
    "name": "Additional Payroll Retirement Contribution"
  },
  {
    "code": 7041,
    "name": "Employee Insurance Payments -  (Employer Contribution)"
  },
  {
    "code": 7042,
    "name": "Payroll Health Insurance Contribution"
  },
  {
    "code": 7043,
    "name": "F.I.C.A. Employer Matching Contribution"
  },
  {
    "code": 7046,
    "name": "High Performance Bonus for Administration of the Supplemental Nutritional Assistance Program (SNAP)"
  },
  {
    "code": 7047,
    "name": "Recruitment and Retention Bonuses"
  },
  {
    "code": 7050,
    "name": "Benefit Replacement Pay"
  },
  {
    "code": 7052,
    "name": "Unemployment Compensation Benefits -  Special Fund Reimbursement"
  },
  {
    "code": 7061,
    "name": "Workers Compensation Claims -  Self Insurance Programs"
  },
  {
    "code": 7062,
    "name": "Workers Compensation -  Indemnity Payments"
  },
  {
    "code": 7071,
    "name": "State Employee Relocation"
  },
  {
    "code": 7081,
    "name": "Retirement/Benefits Payments -  Employee Retirement System"
  },
  {
    "code": 7082,
    "name": "Retirement/Benefits Payments -  Judicial Retirement System"
  },
  {
    "code": 7083,
    "name": "Retirement/Benefits Payments -  Teacher Retirement System"
  },
  {
    "code": 7084,
    "name": "Retirement Payments -  Volunteer Fire Fighters Pension System"
  },
  {
    "code": 7085,
    "name": "Retirement Payments -  Law Enforcement and Custodial Officer Supplement"
  },
  {
    "code": 7086,
    "name": "Optional Retirement -  State Match"
  },
  {
    "code": 7101,
    "name": "Travel In-State -  Public Transportation Fares"
  },
  {
    "code": 7102,
    "name": "Travel In-State -  Mileage"
  },
  {
    "code": 7103,
    "name": "Travel -  Per Diem, Non-Overnight Travel -  Legislature"
  },
  {
    "code": 7104,
    "name": "Travel In-State -  Actual Meal and Lodging Expenses -  Overnight Travel"
  },
  {
    "code": 7105,
    "name": "Travel In-State -  Incidental Expenses"
  },
  {
    "code": 7106,
    "name": "Travel In-State -  Meals and Lodging"
  },
  {
    "code": 7107,
    "name": "Travel In-State -  Non-Overnight Travel (Meals)"
  },
  {
    "code": 7108,
    "name": "Travel In-State -  Actual Expense Meals -  No Overnight Travel"
  },
  {
    "code": 7110,
    "name": "Travel In-State -  Board or Commission Member Meal and Lodging Expenses"
  },
  {
    "code": 7111,
    "name": "Travel Out-of-State -  Public Transportation Fares"
  },
  {
    "code": 7112,
    "name": "Travel Out-of-State -  Mileage"
  },
  {
    "code": 7113,
    "name": "Travel -  Per Diem, Overnight Travel -  Legislature"
  },
  {
    "code": 7114,
    "name": "Travel Out-of-State -  Actual Meal and Lodging Expenses, Overnight Travel"
  },
  {
    "code": 7115,
    "name": "Travel Out-of-State -  Incidental Expenses"
  },
  {
    "code": 7116,
    "name": "Travel Out-of-State -  Meals and Lodging Not to Exceed the Locality-Based Allowance"
  },
  {
    "code": 7117,
    "name": "Travel Out-of-State -  Non-Overnight Travel (Meals)"
  },
  {
    "code": 7118,
    "name": "Travel Out-of-State -  Actual Expense Meals -  No Overnight Travel"
  },
  {
    "code": 7121,
    "name": "Travel -  Foreign"
  },
  {
    "code": 7122,
    "name": "Travel In-State -  Single Engine Aircraft Mileage"
  },
  {
    "code": 7123,
    "name": "Travel Out-of-State -  Single Engine Aircraft Mileage"
  },
  {
    "code": 7124,
    "name": "Travel In-State -  Twin Engine Aircraft Mileage"
  },
  {
    "code": 7125,
    "name": "Travel Out-of-State -  Twin Engine Aircraft Mileage"
  },
  {
    "code": 7126,
    "name": "Travel In-State -  Turbine Powered or Other Aircraft Mileage"
  },
  {
    "code": 7127,
    "name": "Travel Out-of-State -  Turbine Powered or Other Aircraft Mileage"
  },
  {
    "code": 7128,
    "name": "Travel -  Apartment/House Rental Expense"
  },
  {
    "code": 7130,
    "name": "Travel Out-of-State -  Board or Commission Member Meal and Lodging Expenses"
  },
  {
    "code": 7131,
    "name": "Travel -  Prospective State Employees"
  },
  {
    "code": 7134,
    "name": "Legislative Per Diem"
  },
  {
    "code": 7135,
    "name": "Travel In-State - State Hotel Occupancy Tax Expense"
  },
  {
    "code": 7136,
    "name": "Travel In-State -  State Hotel Occupancy Tax Expense Inside Galveston City Limits"
  },
  {
    "code": 7137,
    "name": "Travel In-State -  State Hotel Occupancy Tax Expense Inside South Padre Island City Limits"
  },
  {
    "code": 7138,
    "name": "Travel In-State -  State Hotel Occupancy Tax Expense Inside Port Aransas City Limits"
  },
  {
    "code": 7201,
    "name": "Membership Dues"
  },
  {
    "code": 7202,
    "name": "Tuition -  Employee Training"
  },
  {
    "code": 7203,
    "name": "Registration Fees -  Employee Training"
  },
  {
    "code": 7204,
    "name": "Insurance Premiums and Deductibles"
  },
  {
    "code": 7205,
    "name": "Employee Bonds"
  },
  {
    "code": 7206,
    "name": "Service Fee Paid to the Lottery Operator"
  },
  {
    "code": 7207,
    "name": "Lottery Incentive Bonus"
  },
  {
    "code": 7208,
    "name": "Lottery Winnings"
  },
  {
    "code": 7209,
    "name": "Lottery Winnings -  Installment"
  },
  {
    "code": 7210,
    "name": "Fees and Other Charges"
  },
  {
    "code": 7211,
    "name": "Awards"
  },
  {
    "code": 7212,
    "name": "State Employee -  Cafeteria Plan Reimbursement Premiums"
  },
  {
    "code": 7213,
    "name": "Training Expenses -  Other"
  },
  {
    "code": 7214,
    "name": "Public Assistance Payments -  Unemployment"
  },
  {
    "code": 7215,
    "name": "Return of Retirement Contributions"
  },
  {
    "code": 7216,
    "name": "Insurance Premiums -  Approved by Board of Insurance and Attorney General"
  },
  {
    "code": 7218,
    "name": "Publications"
  },
  {
    "code": 7219,
    "name": "Fees for Receiving Electronic Payments"
  },
  {
    "code": 7220,
    "name": "Court Expenses -  Parental Notification"
  },
  {
    "code": 7221,
    "name": "Settlements and Judgments Texas Tort/Pre-Litigation and Related Claims-No Attorney General Approval Required"
  },
  {
    "code": 7222,
    "name": "Filing Fees -  Documents"
  },
  {
    "code": 7223,
    "name": "Court Costs"
  },
  {
    "code": 7224,
    "name": "Witness Fees and Allowances"
  },
  {
    "code": 7225,
    "name": "Settlements and Judgments for Attorney's Fees"
  },
  {
    "code": 7226,
    "name": "Settlements and Judgments for Claimant/Plaintiff or Other Legal Expenses"
  },
  {
    "code": 7227,
    "name": "Miscellaneous Claims Act Payments"
  },
  {
    "code": 7228,
    "name": "Legislative Claims"
  },
  {
    "code": 7229,
    "name": "Settlements and Judgments for Claimant/Plaintiff and Attorney"
  },
  {
    "code": 7230,
    "name": "Miscellaneous Claims -  Lost/Voided Warrants"
  },
  {
    "code": 7231,
    "name": "Workers Compensation -  Medical Services and Attorney Payments"
  },
  {
    "code": 7232,
    "name": "Workers Compensation Self Insurance Programs -  Medical Services and Attorney Payments"
  },
  {
    "code": 7233,
    "name": "Employee Benefit Payments"
  },
  {
    "code": 7234,
    "name": "Compensation for Crime Victims"
  },
  {
    "code": 7235,
    "name": "Compensation to Victims of Crime Auxiliary Payments"
  },
  {
    "code": 7236,
    "name": "Crime Victim Expenses"
  },
  {
    "code": 7237,
    "name": "Payment of Claims from Trust or Other Funds"
  },
  {
    "code": 7238,
    "name": "Foreign Office Activities"
  },
  {
    "code": 7239,
    "name": "Consultant Services -  Approval by Office of the Governor"
  },
  {
    "code": 7240,
    "name": "Consultant Services -  Other"
  },
  {
    "code": 7241,
    "name": "Settlement and Judgment Interest"
  },
  {
    "code": 7242,
    "name": "Consultant Services -  Computer"
  },
  {
    "code": 7243,
    "name": "Educational/Training Services"
  },
  {
    "code": 7244,
    "name": "Insurance Premiums and Deductibles -  No Approval Required"
  },
  {
    "code": 7245,
    "name": "Financial and Accounting Services"
  },
  {
    "code": 7247,
    "name": "Hearings Officers -  Pre-approved by the State Office of Administrative Hearings"
  },
  {
    "code": 7248,
    "name": "Medical Services"
  },
  {
    "code": 7249,
    "name": "Veterinary Services"
  },
  {
    "code": 7250,
    "name": "Legislative Claims Interest"
  },
  {
    "code": 7252,
    "name": "Lecturers -  Higher Education"
  },
  {
    "code": 7253,
    "name": "Other Professional Services"
  },
  {
    "code": 7254,
    "name": "Other Witness Fees"
  },
  {
    "code": 7255,
    "name": "Investment Counseling Services"
  },
  {
    "code": 7256,
    "name": "Architectural/Engineering Services"
  },
  {
    "code": 7257,
    "name": "Legal Services -  Approval by the State Office of Administrative Hearings"
  },
  {
    "code": 7258,
    "name": "Legal Services"
  },
  {
    "code": 7259,
    "name": "Race Track Officials"
  },
  {
    "code": 7262,
    "name": "Personal Property -  Maintenance and Repair -  Computer Software -  Expensed"
  },
  {
    "code": 7263,
    "name": "Personal Property -  Maintenance and Repair -  Aircraft -  Expensed"
  },
  {
    "code": 7266,
    "name": "Real Property -  Buildings-Maintenance and Repair -  Expensed"
  },
  {
    "code": 7267,
    "name": "Personal Property -  Maintenance and Repair -  Computer Equipment -  Expensed"
  },
  {
    "code": 7270,
    "name": "Real Property -  Infrastructure/Maintenance and Repair -  Expensed"
  },
  {
    "code": 7271,
    "name": "Real Property -  Land/Maintenance and Repair -  Expensed"
  },
  {
    "code": 7272,
    "name": "Hazardous Waste Disposal Services"
  },
  {
    "code": 7273,
    "name": "Reproduction and Printing Services"
  },
  {
    "code": 7274,
    "name": "Temporary Employment Agencies"
  },
  {
    "code": 7275,
    "name": "Information Technology Services"
  },
  {
    "code": 7276,
    "name": "Communication Services"
  },
  {
    "code": 7277,
    "name": "Cleaning Services"
  },
  {
    "code": 7278,
    "name": "Placement Services"
  },
  {
    "code": 7280,
    "name": "Client-Worker Services"
  },
  {
    "code": 7281,
    "name": "Advertising Services"
  },
  {
    "code": 7283,
    "name": "Waste Tire Recycling Program"
  },
  {
    "code": 7284,
    "name": "Data Processing Services"
  },
  {
    "code": 7285,
    "name": "Computer Services -  Statewide Technology Center"
  },
  {
    "code": 7286,
    "name": "Freight/Delivery Service"
  },
  {
    "code": 7291,
    "name": "Postal Services"
  },
  {
    "code": 7292,
    "name": "DIR Payments to Statewide Technology Center"
  },
  {
    "code": 7293,
    "name": "Statewide Telecommunications Network"
  },
  {
    "code": 7295,
    "name": "Investigation Expenses"
  },
  {
    "code": 7297,
    "name": "Emergency Abatement Response"
  },
  {
    "code": 7299,
    "name": "Purchased Contracted Services"
  },
  {
    "code": 7300,
    "name": "Consumables"
  },
  {
    "code": 7303,
    "name": "Subscriptions, Periodicals, and Information Services"
  },
  {
    "code": 7304,
    "name": "Fuels and Lubricants -  Other"
  },
  {
    "code": 7307,
    "name": "Fuels and Lubricants -  Aircraft"
  },
  {
    "code": 7309,
    "name": "Promotional Items"
  },
  {
    "code": 7310,
    "name": "Chemicals and Gases"
  },
  {
    "code": 7312,
    "name": "Medical Supplies"
  },
  {
    "code": 7315,
    "name": "Food Purchased by the State"
  },
  {
    "code": 7316,
    "name": "Food Purchased for Wards of the State"
  },
  {
    "code": 7322,
    "name": "Personal Items -  Wards of the State"
  },
  {
    "code": 7324,
    "name": "Credit Card Purchases for Clients or Wards of the State"
  },
  {
    "code": 7325,
    "name": "Services for Wards of the State"
  },
  {
    "code": 7328,
    "name": "Supplies/Materials -  Agriculture, Construction, and Hardware"
  },
  {
    "code": 7330,
    "name": "Parts -  Furnishings and Equipment"
  },
  {
    "code": 7331,
    "name": "Plants"
  },
  {
    "code": 7333,
    "name": "Fabrics and Linens"
  },
  {
    "code": 7334,
    "name": "Personal Property -  Furnishings, Equipment and Other -  Expensed"
  },
  {
    "code": 7335,
    "name": "Parts -  Computer Equipment -  Expensed"
  },
  {
    "code": 7336,
    "name": "Real Property -  Facilities and Other Improvements -  Capitalized"
  },
  {
    "code": 7337,
    "name": "Real Property -  Facilities and Other Improvements/ Capital Lease"
  },
  {
    "code": 7338,
    "name": "Real Property -  Facilities and Other Improvements/ Maintenance and Repairs -  Expensed"
  },
  {
    "code": 7340,
    "name": "Real Property and Improvements -  Expensed"
  },
  {
    "code": 7341,
    "name": "Real Property -  Construction in Progress -  Capitalized"
  },
  {
    "code": 7342,
    "name": "Real Property -  Buildings -  Capitalized"
  },
  {
    "code": 7343,
    "name": "Real Property -  Building Improvements -  Capitalized"
  },
  {
    "code": 7344,
    "name": "Leasehold Improvements -  Capitalized"
  },
  {
    "code": 7345,
    "name": "Real Property -  Land -  Capitalized"
  },
  {
    "code": 7346,
    "name": "Real Property -  Land Improvements -  Capitalized"
  },
  {
    "code": 7347,
    "name": "Real Property -  Construction in Progress/Highway Network -  Capitalized"
  },
  {
    "code": 7348,
    "name": "Real Property -  Land/Highway Right-of-Way -  Capitalized"
  },
  {
    "code": 7349,
    "name": "Intangible Assets-Land Use Rights-Permanent-Capitalized"
  },
  {
    "code": 7350,
    "name": "Real Property -  Buildings/Capital Lease"
  },
  {
    "code": 7351,
    "name": "Personal Property -  Passenger Cars/Capital Lease"
  },
  {
    "code": 7352,
    "name": "Personal Property -  Other Motor Vehicles/Capital Lease"
  },
  {
    "code": 7353,
    "name": "Intangible Assets - Land Use Rights - Term - Capitalized"
  },
  {
    "code": 7354,
    "name": "Leasehold Improvements -  Expensed"
  },
  {
    "code": 7355,
    "name": "Intangible Assets - Land Use Rights - Term - Expensed"
  },
  {
    "code": 7356,
    "name": "Real Property -  Infrastructure -  Capitalized"
  },
  {
    "code": 7357,
    "name": "Real Property -  Infrastructure/Preservation Costs -  Capitalized"
  },
  {
    "code": 7358,
    "name": "Real Property -  Infrastructure/Preservation Costs -  Expensed"
  },
  {
    "code": 7359,
    "name": "Patents & Copyrights - Capitalized"
  },
  {
    "code": 7360,
    "name": "Intangible Assets - Patents and Copyrights - Expensed"
  },
  {
    "code": 7361,
    "name": "Personal Property -  Capitalized"
  },
  {
    "code": 7362,
    "name": "Intangible Assets - Trademarks - Capitalized"
  },
  {
    "code": 7363,
    "name": "Intangible Assets - Trademarks - Expensed"
  },
  {
    "code": 7365,
    "name": "Personal Property -  Boats -  Capitalized"
  },
  {
    "code": 7366,
    "name": "Personal Property -  Capital Lease"
  },
  {
    "code": 7367,
    "name": "Personal Property -  Maintenance and Repair -  Expensed"
  },
  {
    "code": 7368,
    "name": "Personal Property -  Maintenance and Repairs/Motor Vehicle -  Expensed"
  },
  {
    "code": 7369,
    "name": "Personal Property -  Works of Art and Historical Treasures -  Capitalized"
  },
  {
    "code": 7371,
    "name": "Personal Property -  Passenger Cars -  Capitalized"
  },
  {
    "code": 7372,
    "name": "Personal Property -  Other Motor Vehicles -  Capitalized"
  },
  {
    "code": 7373,
    "name": "Personal Property -  Furnishings and Equipment -  Capitalized"
  },
  {
    "code": 7374,
    "name": "Personal Property -  Furnishings and Equipment -  Controlled"
  },
  {
    "code": 7375,
    "name": "Personal Property -  Aircraft -  Capitalized"
  },
  {
    "code": 7376,
    "name": "Personal Property -  Furnishings and Equipment -  Capital Lease"
  },
  {
    "code": 7377,
    "name": "Personal Property -  Computer Equipment -  Expensed"
  },
  {
    "code": 7378,
    "name": "Personal Property -  Computer Equipment -  Controlled"
  },
  {
    "code": 7379,
    "name": "Personal Property -  Computer Equipment -  Capitalized"
  },
  {
    "code": 7380,
    "name": "Intangible Property - Computer Software - Expensed"
  },
  {
    "code": 7382,
    "name": "Personal Property -  Books and Reference Materials -  Expensed"
  },
  {
    "code": 7383,
    "name": "Textbooks for Public Free Schools"
  },
  {
    "code": 7384,
    "name": "Personal Property -  Animals -  Expensed"
  },
  {
    "code": 7385,
    "name": "Personal Property -  Computer Equipment -  Capital Lease"
  },
  {
    "code": 7386,
    "name": "Personal Property -  Animals -  Capitalized"
  },
  {
    "code": 7388,
    "name": "Personal Property -  Construction in Progress -  Fabrication of Equipment -  Capitalized"
  },
  {
    "code": 7389,
    "name": "Personal Property -  Books and Reference Materials -  Capitalized"
  },
  {
    "code": 7390,
    "name": "Intangible - Computer Software - Internally Developed - Capitalized"
  },
  {
    "code": 7391,
    "name": "Central Supply Retail Store"
  },
  {
    "code": 7392,
    "name": "Land Purchased for Resale/Housing Loans"
  },
  {
    "code": 7393,
    "name": "Merchandise Purchased for Resale"
  },
  {
    "code": 7394,
    "name": "Raw Material Purchases"
  },
  {
    "code": 7395,
    "name": "Intangible - Computer Software - Purchased - Capitalized"
  },
  {
    "code": 7396,
    "name": "TxDOT Toll Road Expense - Preliminary Engineering"
  },
  {
    "code": 7397,
    "name": "TxDOT Toll Road Expense - Construction"
  },
  {
    "code": 7398,
    "name": "TxDOT Toll Road Expense - Construction Engineering"
  },
  {
    "code": 7399,
    "name": "TxDOT Toll Road Expense - Right of Way"
  },
  {
    "code": 7401,
    "name": "Rental of Radio Towers"
  },
  {
    "code": 7406,
    "name": "Rental of Furnishings and Equipment"
  },
  {
    "code": 7411,
    "name": "Rental of Computer Equipment"
  },
  {
    "code": 7415,
    "name": "Rental of Computer Software"
  },
  {
    "code": 7421,
    "name": "Rental of Reference Material"
  },
  {
    "code": 7442,
    "name": "Rental of Motor Vehicles"
  },
  {
    "code": 7443,
    "name": "Rental of Aircraft -  Exempt"
  },
  {
    "code": 7444,
    "name": "Charter of Aircraft"
  },
  {
    "code": 7445,
    "name": "Rental of Aircraft"
  },
  {
    "code": 7449,
    "name": "Rental of Marine Equipment"
  },
  {
    "code": 7461,
    "name": "Rental of Land"
  },
  {
    "code": 7462,
    "name": "Rental of Office Buildings or Office Space"
  },
  {
    "code": 7468,
    "name": "Rental of Service Buildings"
  },
  {
    "code": 7470,
    "name": "Rental of Space"
  },
  {
    "code": 7501,
    "name": "Electricity"
  },
  {
    "code": 7502,
    "name": "Natural and Liquefied Petroleum Gas"
  },
  {
    "code": 7503,
    "name": "Telecommunications -  Long Distance"
  },
  {
    "code": 7504,
    "name": "Telecommunications -  Monthly Charge"
  },
  {
    "code": 7507,
    "name": "Water"
  },
  {
    "code": 7510,
    "name": "Telecommunications -  Parts and Supplies"
  },
  {
    "code": 7512,
    "name": "Personal Property -  Telecommunications Equipment -  Capitalized"
  },
  {
    "code": 7514,
    "name": "Real Property -  Infrastructure/Telecommunications -  Maintenance and Repair -  Expensed"
  },
  {
    "code": 7516,
    "name": "Telecommunications -  Other Service Charges"
  },
  {
    "code": 7517,
    "name": "Personal Property -  Telecommunications Equipment -  Expensed"
  },
  {
    "code": 7518,
    "name": "Telecommunications -  Dedicated Data Circuit"
  },
  {
    "code": 7519,
    "name": "Real Property -  Infrastructure -  Telecommunications -  Capital Lease"
  },
  {
    "code": 7520,
    "name": "Real Property -  Infrastructure -  Telecommunications -  Capitalized"
  },
  {
    "code": 7521,
    "name": "Real Property -  Infrastructure/Telecommunications -  Expensed"
  },
  {
    "code": 7522,
    "name": "Telecommunications -  Equipment Rental"
  },
  {
    "code": 7524,
    "name": "Other Utilities"
  },
  {
    "code": 7526,
    "name": "Waste Disposal"
  },
  {
    "code": 7530,
    "name": "Thermal Energy"
  },
  {
    "code": 7601,
    "name": "Grants -  Elementary and Secondary Schools"
  },
  {
    "code": 7602,
    "name": "School Apportionment -  Foundation Program"
  },
  {
    "code": 7603,
    "name": "Grants -  Junior Colleges"
  },
  {
    "code": 7604,
    "name": "Grants -  Senior Colleges and Universities"
  },
  {
    "code": 7611,
    "name": "Payments/Grants -  Cities"
  },
  {
    "code": 7612,
    "name": "Payments/Grants -  Counties"
  },
  {
    "code": 7613,
    "name": "Payments/Grants -  Other Political Subdivisions"
  },
  {
    "code": 7614,
    "name": "State Grant Pass-Through Expenditure -  Non-Operating"
  },
  {
    "code": 7615,
    "name": "State Grant Pass-Through Expenditure -  Operating"
  },
  {
    "code": 7621,
    "name": "Grants -  Council of Governments"
  },
  {
    "code": 7622,
    "name": "Grants -  Judicial Districts"
  },
  {
    "code": 7623,
    "name": "Grants -  Community Service Programs"
  },
  {
    "code": 7624,
    "name": "Grants to Individuals"
  },
  {
    "code": 7636,
    "name": "Texas Tomorrow Fund -  Payment of Prepaid Tuition and Required Higher Education Fees"
  },
  {
    "code": 7639,
    "name": "Texas Tomorrow Fund -  Payment of Earnings to Purchaser (Due Upon Refund)"
  },
  {
    "code": 7640,
    "name": "Public Assistance -  Child Support Payments, Non-Title IV-D"
  },
  {
    "code": 7641,
    "name": "Public Assistance -  Temporary Assistance for Needy Families (TANF)"
  },
  {
    "code": 7642,
    "name": "Public Assistance -  Child Support Payments, Title IV-D"
  },
  {
    "code": 7643,
    "name": "Other Financial Services"
  },
  {
    "code": 7644,
    "name": "Commodity Distribution Program"
  },
  {
    "code": 7645,
    "name": "Disaster Relief Payments"
  },
  {
    "code": 7651,
    "name": "Financial Services -  Discharged Convicts"
  },
  {
    "code": 7652,
    "name": "Financial Services -  Rehabilitation Clients"
  },
  {
    "code": 7661,
    "name": "Medical Services -  Nursing Home Programs"
  },
  {
    "code": 7662,
    "name": "Vendor Drug Program"
  },
  {
    "code": 7664,
    "name": "Supplementary Medical Insurance Benefits"
  },
  {
    "code": 7666,
    "name": "Medical Services and Specialties"
  },
  {
    "code": 7671,
    "name": "Grants-in-Aid (Day Care)"
  },
  {
    "code": 7672,
    "name": "Grants-in-Aid (Foster Care)"
  },
  {
    "code": 7673,
    "name": "Grants-in-Aid (Care for Aged, Blind and Disabled)"
  },
  {
    "code": 7674,
    "name": "Grants-in-Aid (Services for Children/Clients)"
  },
  {
    "code": 7676,
    "name": "Grants-in-Aid (Transportation)"
  },
  {
    "code": 7677,
    "name": "Family Planning Services"
  },
  {
    "code": 7678,
    "name": "Employment Social Services"
  },
  {
    "code": 7679,
    "name": "Grants -  College/Vocational Students"
  },
  {
    "code": 7680,
    "name": "Grants-in-Aid (Food)"
  },
  {
    "code": 7681,
    "name": "Grants -  Survivors"
  },
  {
    "code": 7682,
    "name": "Allocation to Cities - Mixed Beverage Sales Tax"
  },
  {
    "code": 7683,
    "name": "Allocation to Cities - Mixed Beverage Tax"
  },
  {
    "code": 7684,
    "name": "Allocation to Counties - Mixed Beverage Tax"
  },
  {
    "code": 7686,
    "name": "Breakage Payments -  Horse Racing"
  },
  {
    "code": 7687,
    "name": "Breakage Payments -  Greyhound Racing"
  },
  {
    "code": 7688,
    "name": "Allocation for International Fuels Tax Agreement (IFTA)"
  },
  {
    "code": 7689,
    "name": "Allocation to Counties - Mixed Beverage Sales Tax"
  },
  {
    "code": 7696,
    "name": "Rebates -  Tuition"
  },
  {
    "code": 7697,
    "name": "Grants -  Public Incentive Programs"
  },
  {
    "code": 7698,
    "name": "Advances for Public Incentive Programs"
  },
  {
    "code": 7701,
    "name": "Loans to Political Subdivisions"
  },
  {
    "code": 7702,
    "name": "Loans to College Students"
  },
  {
    "code": 7705,
    "name": "Loans to Non-Governmental Entities"
  },
  {
    "code": 7706,
    "name": "Loans to Provide Financial Assistance for Texas Agricultural Products"
  },
  {
    "code": 7707,
    "name": "Loans to Other State Agencies"
  },
  {
    "code": 7708,
    "name": "Repayment of Loans to Other State Agency"
  },
  {
    "code": 7712,
    "name": "Purchase of Real Estate Investments"
  },
  {
    "code": 7713,
    "name": "Purchase of Miscellaneous Short-Term Investments and Short-Term Investment Funds"
  },
  {
    "code": 7714,
    "name": "Purchase of Miscellaneous Investments -  Long-Term"
  },
  {
    "code": 7718,
    "name": "Purchase of Repurchase Agreements"
  },
  {
    "code": 7720,
    "name": "Purchase of Other Public Obligations -  Long-Term"
  },
  {
    "code": 7731,
    "name": "Premium/Discount on Mortgage Investments"
  },
  {
    "code": 7733,
    "name": "Premium/Discount on Other Public Obligations"
  },
  {
    "code": 7735,
    "name": "Premium/Discount on United States Government Obligations"
  },
  {
    "code": 7800,
    "name": "Defeasance of State Bonds"
  },
  {
    "code": 7801,
    "name": "Interest on Governmental and Fiduciary Long-Term Debt"
  },
  {
    "code": 7802,
    "name": "Interest -  Other"
  },
  {
    "code": 7803,
    "name": "Principal on State Bonds"
  },
  {
    "code": 7804,
    "name": "Principal on Other Indebtedness"
  },
  {
    "code": 7805,
    "name": "County Road Bond Payments"
  },
  {
    "code": 7806,
    "name": "Interest on Delayed Payments"
  },
  {
    "code": 7807,
    "name": "Principal on Tax and Revenue Anticipation Notes"
  },
  {
    "code": 7808,
    "name": "Arbitrage"
  },
  {
    "code": 7809,
    "name": "Other Financing Fees"
  },
  {
    "code": 7810,
    "name": "Defeasance of State Bonds -  Refunded"
  },
  {
    "code": 7811,
    "name": "Interest on Refund or Credit of Tax or Fee"
  },
  {
    "code": 7812,
    "name": "Interest on Protest Payments"
  },
  {
    "code": 7814,
    "name": "Interest on Proprietary Long-Term Debt -  Operating"
  },
  {
    "code": 7815,
    "name": "Interest on Proprietary Long-Term Debt -  Non-Operating"
  },
  {
    "code": 7829,
    "name": "Disburse Medicaid Incentive Transfer -  State (UPL)"
  },
  {
    "code": 7830,
    "name": "Disbursement of Disproportionate Share Funds/ State Hospitals"
  },
  {
    "code": 7831,
    "name": "Disbursement of Disproportionate Share Funds/ Non-State Hospitals"
  },
  {
    "code": 7835,
    "name": "Disbursement Medicaid Incentive Transfers"
  },
  {
    "code": 7870,
    "name": "Payment to Escrow for Refunding"
  },
  {
    "code": 7871,
    "name": "Bond Issuance Expenses"
  },
  {
    "code": 7899,
    "name": "Replenish Petty/Travel/Imprest Cash Shortage"
  },
  {
    "code": 7900,
    "name": "Imprest Cash Advances"
  },
  {
    "code": 7902,
    "name": "Trust or Suspense Payment"
  },
  {
    "code": 7903,
    "name": "Trust Payment - Remuneration by Private Party"
  },
  {
    "code": 7904,
    "name": "Petty Cash Advance"
  },
  {
    "code": 7905,
    "name": "Travel Cash Advance"
  },
  {
    "code": 7907,
    "name": "Summer Food Program Advance"
  },
  {
    "code": 7909,
    "name": "Teacher Retirement Reimbursement"
  },
  {
    "code": 7910,
    "name": "Escheated Funds Payments"
  },
  {
    "code": 7915,
    "name": "Allocations from Fund 0068 to Fund 0001 -  Mixed Beverage"
  },
  {
    "code": 7921,
    "name": "Allocation from Fund 0001 to State Parks Account 0064 -  Cigarette Tax"
  },
  {
    "code": 7930,
    "name": "Trust Payments -  City Sales Tax Allocation"
  },
  {
    "code": 7931,
    "name": "Trust Payments -  County Sales Tax Allocation"
  },
  {
    "code": 7932,
    "name": "Trust Payments -  MTA Sales Tax Allocation"
  },
  {
    "code": 7933,
    "name": "Trust Payments -  SPD Sales Tax Allocation"
  },
  {
    "code": 7947,
    "name": "State Office of Risk Management Assessments"
  },
  {
    "code": 7953,
    "name": "Statewide Cost Allocation Plan (SWCAP) Reimbursements to Unappropriated GR 0001"
  },
  {
    "code": 7958,
    "name": "Payment From State Appropriation to Local Account"
  },
  {
    "code": 7961,
    "name": "STS (TEX-AN) Transfers to General Revenue 0001"
  },
  {
    "code": 7962,
    "name": "Capitol Complex Transfers to General Revenue 0001"
  },
  {
    "code": 7970,
    "name": "Revenue and Expenditure Adjustments Within an Agency, Fund or Account and Fiscal Year"
  },
  {
    "code": 7971,
    "name": "Federal Pass-Through Expenditure Interagency, Non-Operating for General Budgeted"
  },
  {
    "code": 7974,
    "name": "Federal Funds UB Cash Forward"
  },
  {
    "code": 7978,
    "name": "Federal Pass-Through Expenditure Interagency, Operating for General Budgeted"
  },
  {
    "code": 7984,
    "name": "Unemployment Compensation Benefit Transfers -  Special Funds/Accounts to GR 0001 and Account 0165"
  }
]
// Comptroller Code Tool
export const getComptrollerCodeTool = tool({
  description: 'Gets the comptroller object number for a comptroller object name. Uses AI to intelligently match user queries to the most relevant Texas comptroller objects from all 378 available objects.',
  parameters: z.object({
    searchTerm: z.string().describe('The name or description of the comptroller object to search for (can be partial names or functional descriptions like "medical expenses", "equipment", "salaries").'),
  }),
  execute: async ({ searchTerm }) => {
    try {
      // Use AI to intelligently match comptroller objects
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        system: `You are an expert on Texas government comptroller objects and accounting codes. Your task is to find the most relevant comptroller objects based on user queries.

AVAILABLE TEXAS COMPTROLLER OBJECTS:
${COMPTROLLER_CODES.map(code => `${code.code}: ${code.name}`).join('\n')}

MATCHING GUIDELINES:
- Understand user intent and functional purpose of expenditures
- Handle partial names intelligently (e.g., "salaries" matches salary-related objects)
- Consider expense categories (e.g., "medical" matches medical-related objects, "equipment" matches equipment purchases)
- Match common accounting terms and descriptions
- Understand government accounting context (e.g., "travel" matches travel-related expenses)
- Prioritize the most relevant matches
- If only one clear match, return just that one
- If multiple relevant matches, return up to 8 most relevant ones
- Consider both the object number and descriptive name for better matching`,

        prompt: `Find the most relevant Texas comptroller objects for: "${searchTerm}"
        
Return the objects that best match this query, considering:
- Exact name matches
- Functional purpose matches
- Expense category matches
- Accounting terminology
- User intent and context`,

        schema: z.object({
          matches: z.array(z.object({
            code: z.number(),
            name: z.string(),
            relevanceReason: z.string().describe('Brief explanation of why this comptroller object matches the search')
          })),
          searchInterpretation: z.string().describe('How you interpreted the user\'s search intent'),
          confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level in the matches')
        })
      });

      const { matches, searchInterpretation, confidence } = result.object;

      if (matches.length === 0) {
        return { 
          result: `No relevant comptroller objects found for "${searchTerm}". ${searchInterpretation}. Try searching with terms like "salaries", "equipment", "medical", "travel", or specific expense types.` 
        };
      }

      if (matches.length === 1) {
        const object = matches[0];
        return { 
          result: `The comptroller object number for ${object.name} is ${object.code}. ${object.relevanceReason}` 
        };
      }

      // Multiple matches
      const objectList = matches
        .map(object => `${object.name} (Code: ${object.code})`)
        .join(', ');

      const confidenceText = confidence === 'low' ? ' (Note: Low confidence - please verify these matches)' : '';
      
      return { 
        result: `Found ${matches.length} relevant comptroller objects for "${searchTerm}": ${objectList}. ${searchInterpretation}${confidenceText}` 
      };

    } catch (e) {
      console.error('Error in AI comptroller object search:', e);
      
      // Fallback to simple string matching if AI fails
      const simpleMatches = COMPTROLLER_CODES
        .filter(object => 
          object.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 8);

      if (simpleMatches.length > 0) {
        const fallbackList = simpleMatches
          .map(object => `${object.name} (Code: ${object.code})`)
          .join(', ');
        return { 
          result: `AI search unavailable, using fallback search for "${searchTerm}": ${fallbackList}` 
        };
      }

      return { result: `Search temporarily unavailable. Please try again or contact support.` };
    }
  },
});

// ========================================
// NEW SQL GENERATION TOOLS (Step 1.2)
// ========================================

// Enhanced SQL Analytics Query Generation Tool
export const generateAnalyticsQueryTool = tool({
  description: 'Generate PostgreSQL queries using pre-resolved entity IDs from lookup tools.   ',
  parameters: z.object({
    naturalLanguageQuery: z.string(),
    resolvedEntities: z.object({
      agencyIds: z.array(z.number()).optional(),
      categoryIds: z.array(z.number()).optional(),
      fundIds: z.array(z.number()).optional(),
      payeeIds: z.array(z.number()).optional(),
      appropriationIds: z.array(z.number()).optional(),
      comptrollerIds: z.array(z.number()).optional(),
      applicationFundIds: z.array(z.number()).optional(),
      dateRange: z.object({
        start: z.string(),
        end: z.string()
      }).optional()
    }).optional()
  }),
  execute: async ({ naturalLanguageQuery, resolvedEntities }) => {
    try {
      // Use AI SDK generateObject with schema context
      const result = await generateObject({
        model: openai('gpt-4.1'),
        system: DATABASE_SCHEMA_CONTEXT + `
        
        CRITICAL ROW LIMIT REQUIREMENT:
        - ALWAYS include "LIMIT 25" in every SQL query
        - NEVER generate queries that return more than 25 rows
        - This is a hard requirement that cannot be overridden
        - Even if user asks for more, always limit to 25 rows maximum
        
        ENTITY RESOLUTION INTEGRATION:
        - Use provided entity IDs directly in WHERE clauses
        - No fuzzy matching needed - entities already resolved
        - Generate precise queries with exact ID matching
        
        EXAMPLES WITH RESOLVED ENTITIES:
        - agencyIds: [529, 537] → WHERE p."Agency_CD" IN (529, 537)
        - categoryIds: [5] → WHERE p."CatCode" = 5
        - dateRange specified → WHERE p."date" BETWEEN 'start' AND 'end'`,
        
        prompt: `Generate optimized PostgreSQL query for: "${naturalLanguageQuery}"
        
        Resolved Entities: ${JSON.stringify(resolvedEntities || {}, null, 2)}
        
        MANDATORY REQUIREMENTS:
        - Use exact entity IDs in WHERE clauses for precision
        - MUST include "LIMIT 25" at the end of every query
        - Maximum 25 rows returned - this is non-negotiable`,
        
        schema: z.object({
          sqlQuery: z.string(),
          explanation: z.string(),
          isValid: z.boolean(),
          estimatedRows: z.number(),
          chartSuitable: z.boolean(),
          temporalAnalysis: z.boolean(),
          entityContext: z.string() // Explain which entities were used
        })
      });
      
      return result.object;
      
    } catch (e) {
      console.error('Error generating SQL query:', e);
      return {
        sqlQuery: '',
        isValid: false,
        explanation: 'Failed to generate SQL query',
        error: 'An error occurred while generating the SQL query',
        estimatedRows: 0,
        chartSuitable: false,
        temporalAnalysis: false,
        entityContext: ''
      };
    }
  },
});

// Enhanced Query Execution Tool
export const executeAnalyticsQueryTool = tool({
  description: 'Safely execute SQL queries against the Texas DOGE database',
  parameters: z.object({
    sqlQuery: z.string(),
    maxRows: z.number().default(1000)
  }),
  execute: async ({ sqlQuery, maxRows }) => {
    try {
      // Validate query safety (SELECT only, no modifications)
      if (!sqlQuery.trim().toUpperCase().startsWith('SELECT')) {
        return { error: 'Only SELECT queries are allowed', results: [] };
      }
      
      // The Supabase function now handles LIMIT clauses properly
      const { data, error } = await supabase.rpc('execute_analytics_query', {
        query_text: sqlQuery
      });
      
      if (error) {
        return { error: error.message, results: [] };
      }
      
      // Process results (format dates only - amounts already in dollars)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedResults = data?.map((row: any) => {
        const processedRow = { ...row };
        
        // Format dates consistently
        if (processedRow.date) {
          processedRow.date = new Date(processedRow.date).toISOString().split('T')[0];
        }
        if (processedRow.month) {
          processedRow.month = new Date(processedRow.month).toISOString().split('T')[0];
        }
        
        return processedRow;
      }) || [];
      
      return { 
        results: processedResults,
        rowCount: processedResults.length,
        hasMoreResults: processedResults.length === maxRows
      };
      
    } catch (e) {
      console.error('Query execution error:', e);
      return { error: 'Query execution failed', results: [] };
    }
  }
});

// Enhanced SQL Query Explanation Tool
export const explainSQLQueryTool = tool({
  description: 'Explain SQL queries with business context for Texas DOGE database',
  parameters: z.object({
    sqlQuery: z.string(),
    originalQuestion: z.string(),
  }),
  execute: async ({ sqlQuery, originalQuestion }) => {
    try {
      const result = await generateObject({
        model: openai('gpt-4.1'),
        system: `${DATABASE_SCHEMA_CONTEXT}
        
        Explain SQL queries for Texas government spending analysis.
        Break down each section with business context and data insights.`,
        prompt: `Explain this SQL query in simple terms:
        
        Original Question: ${originalQuestion}
        SQL Query: ${sqlQuery}`,
        schema: z.object({
          sections: z.array(z.object({
            sqlSection: z.string(),
            explanation: z.string(),
            businessContext: z.string()
          })),
          summary: z.string(),
          dataInsights: z.array(z.string()),
          complexity: z.enum(['Simple', 'Moderate', 'Complex'])
        })
      });
      
      return result.object;
      
    } catch (e) {
      console.error('Error explaining SQL query:', e);
      return {
        sections: [],
        summary: 'Failed to explain the SQL query',
        dataInsights: [],
        complexity: 'Simple' as const,
        error: 'An error occurred while explaining the query'
      };
    }
  },
});

// Enhanced Chart Configuration Generation Tool
export const generateChartConfigTool = tool({
  description: 'Generate intelligent chart configurations with business insights, enhanced features, and alternative chart type suggestions',
  parameters: z.object({
    queryResultsJson: z.string().describe('JSON string of processed query results from executeAnalyticsQueryTool'),
    originalQuestion: z.string(),
    sqlQuery: z.string(),
    entityContext: z.string().optional()
  }),
  execute: async ({ queryResultsJson, originalQuestion, sqlQuery, entityContext }) => {
    try {
      const queryResults = JSON.parse(queryResultsJson);
      
      if (!queryResults || queryResults.length === 0) {
        return {
          chartConfig: null,
          message: 'No data available for chart generation'
        };
      }
      
      // queryResults is now the processed data from executeAnalyticsQueryTool
      // - Amounts already converted to dollars (no need to divide by 100)  
      // - Dates already formatted as YYYY-MM-DD strings
      // - Ready for direct chart consumption

      const result = await generateObject({
        model: openai('gpt-4o'),
        system: `You are a data visualization expert for Texas government spending with expertise in enhanced chart features and multiple chart type recommendations.
        
        ENHANCED CHART TYPE SELECTION WITH ALTERNATIVES:
        - bar: Best for categorical comparisons (agencies, categories, funds)
          * Perfect for ranking and comparison analysis
          * Include rich contextual tooltips
        - line: Ideal for time series trends with zoom/brush capabilities
          * Show seasonal patterns and trend analysis
          * Enable zoom controls for detailed exploration
        - area: Cumulative analysis over time with interactive zoom
          * Best for showing growth patterns and total accumulation
        - pie: Composition analysis with detailed tooltips
          * Show percentage distributions effectively
          * Rich hover information
        
        ALTERNATIVE CHART GENERATION STRATEGY:
        - Always suggest 2-3 alternative chart types that would work well with the data
        - Rate each alternative's suitability on a scale of 1-10
        - Provide clear reasoning why each alternative would be valuable
        - Consider different analytical perspectives (comparison vs trends vs composition)
        - Ensure the primary recommendation is the best fit, alternatives offer different insights
        
        
        BUSINESS CONTEXT INTEGRATION:
        - Reference specific Texas agencies and their roles
        - Provide actionable insights about government spending patterns
        - Highlight anomalies, trends, and fiscal efficiency opportunities
        - Consider Texas fiscal year context (Oct-Sep) and legislative cycles
        - Include contextual insights for major agencies:
          * Health and Human Services: Social services, healthcare, public assistance
          * Education: Universities, K-12, student aid, research
          * Transportation: Infrastructure, highways, public transit
          * Military: State guard, emergency response, homeland security
        
        ENHANCED FEATURES:
        - Generate insights that work well in hover tooltips
        - Create business context that helps users understand spending patterns
        - Suggest natural follow-up analyses based on the data pattern
        - Focus on rich, informative visualizations with professional styling`,
        
        prompt: `Generate enhanced chart configuration with multiple type options for: "${originalQuestion}"
        
        SQL Query: ${sqlQuery}
        Entity Context: ${entityContext || 'General analysis'}
        Sample Data: ${JSON.stringify(queryResults.slice(0, 3), null, 2)}
        Total Records: ${queryResults.length}
        
        Primary goal: Choose the BEST chart type as primary, then suggest 2-3 alternatives that would provide different analytical perspectives on the same data.`,
        
        schema: z.object({
          type: z.enum(['bar', 'line', 'area', 'pie']),
          title: z.string(),
          description: z.string(),
          xKey: z.string(),
          yKeys: z.array(z.string()),
          colors: z.record(z.string(), z.string()).optional(),
          legend: z.boolean(),
          // Enhanced business insights optimized for tooltips and context
          businessInsights: z.array(z.string()),
          takeaway: z.string(),
          // Interactive analysis features
          isTimeSeries: z.boolean(),
          trendAnalysis: z.object({
            direction: z.enum(['increasing', 'decreasing', 'stable', 'volatile']),
            changePercent: z.number().optional(),
            seasonality: z.string().optional()
          }).optional(),
          // NEW: Alternative chart suggestions
          alternativeCharts: z.array(z.object({
            type: z.enum(['bar', 'line', 'area', 'pie']),
            title: z.string().describe('Alternative title optimized for this chart type'),
          })).optional(),
          // Enhanced data quality indicators  
          dataQuality: z.object({
            completeness: z.number(), // 0-100%
            timeRange: z.string(),
            sampleSize: z.string()
          }),
          // Enhanced features metadata
          enhancementLevel: z.enum(['basic', 'moderate', 'high']),
          suggestedAnalyses: z.array(z.string()).optional()
        })
      });
      
      const chartConfig = result.object as {
        type: 'bar' | 'line' | 'area' | 'pie';
        title: string;
        description: string;
        xKey: string;
        yKeys: string[];
        colors?: Record<string, string>;
        legend: boolean;
        businessInsights: string[];
        takeaway: string;
        isTimeSeries: boolean;
        trendAnalysis?: {
          direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
          changePercent?: number;
          seasonality?: string;
        };
        alternativeCharts?: Array<{
          type: 'bar' | 'line' | 'area' | 'pie';
          reason: string;
          suitability: number;
          title: string;
          analyticalPerspective: string;
        }>;
        dataQuality: {
          completeness: number;
          timeRange: string;
          sampleSize: string;
        };
        enhancementLevel: 'basic' | 'moderate' | 'high';
        suggestedAnalyses?: string[];
      };

      // Generate default colors optimized for accessibility and visual appeal
      if (!chartConfig.colors) {
        const defaultColors: Record<string, string> = {};
        chartConfig.yKeys.forEach((key, index) => {
          // Use high-contrast, colorblind-friendly palette
          const colors = [
            '#1f77b4', // Blue
            '#ff7f0e', // Orange  
            '#2ca02c', // Green
            '#d62728', // Red
            '#9467bd', // Purple
            '#8c564b', // Brown
            '#e377c2', // Pink
            '#7f7f7f', // Gray
            '#bcbd22', // Olive
            '#17becf'  // Cyan
          ];
          defaultColors[key] = colors[index % colors.length];
        });
        chartConfig.colors = defaultColors;
      }

      return {
        chartConfig: chartConfig,
        dataPoints: queryResults.length,
        hasTimeSeries: chartConfig.isTimeSeries,
        enhancementLevel: chartConfig.enhancementLevel,
        hasEnhancedFeatures: true,
        hasAlternatives: (chartConfig.alternativeCharts?.length || 0) > 0,
        alternativeCount: chartConfig.alternativeCharts?.length || 0,
        message: `Generated enhanced ${chartConfig.type} chart with ${chartConfig.enhancementLevel} enhancement level and ${chartConfig.alternativeCharts?.length || 0} alternative chart types for ${queryResults.length} data points`
      };

    } catch (e) {
      console.error('Error generating chart config:', e);
      return {
        chartConfig: null,
        error: e instanceof SyntaxError 
          ? 'Invalid JSON data provided for chart generation'
          : 'An error occurred while generating chart configuration',
        suggestion: 'Try rephrasing your request or asking for a simpler chart type'
      };
    }
  },
});





// ========================================
// INTELLIGENT DRILL-DOWN QUERY TOOL
// ========================================

export const generateDrillDownQueryTool = tool({
  description: 'Generate intelligent drill-down queries that discover what comptroller objects or subcategories exist for specific agency+category combinations. Use this for "breakdown" or "drill down" requests.',
  parameters: z.object({
    drillDownType: z.enum(['comptroller_objects', 'payee_breakdown', 'time_series', 'fund_breakdown']).describe('Type of drill-down analysis to perform'),
    baseQuery: z.object({
      agencyId: z.number().optional().describe('Agency code to filter by'),
      categoryId: z.number().optional().describe('Category code to filter by (use this for "breakdown salaries and wages" type requests)'),
      fundId: z.number().optional().describe('Fund code to filter by'),
      payeeId: z.number().optional().describe('Payee ID to filter by'),
      dateRange: z.object({
        start: z.string(),
        end: z.string()
      }).optional()
    }),
    originalQuestion: z.string().describe('The original user question for context'),
    contextFromPrevious: z.string().optional().describe('Context from previous query results')
  }),
  execute: async ({ drillDownType, baseQuery, originalQuestion, contextFromPrevious }) => {
    try {
      const result = await generateObject({
        model: openai('gpt-4o'),
        system: `${DATABASE_SCHEMA_CONTEXT}

INTELLIGENT DRILL-DOWN QUERY GENERATION:

You are generating DISCOVERY queries that find what actually exists in the data rather than assuming specific codes exist.

DRILL-DOWN PATTERNS:

1. COMPTROLLER_OBJECTS (for "breakdown salaries and wages more", "detail on Other Expenditures"):
   - Discover comptroller objects within a category for a specific agency
   - Pattern: Find all comptroller objects WHERE agency = X AND category = Y
   - Query: SELECT comptroller_object_name, SUM(amount), COUNT(*) FROM payments + joins WHERE agency AND category GROUP BY comptroller_object

2. PAYEE_BREAKDOWN (for "who received the money", "top vendors"):
   - Discover top payees within specific criteria
   - Pattern: Find top payees WHERE [filters] ORDER BY total_amount DESC
   
3. TIME_SERIES (for "spending over time", "monthly trends"):
   - Discover spending patterns over time periods
   - Pattern: GROUP BY date/month/year with time-based analysis
   
4. FUND_BREAKDOWN (for "funding sources", "which funds"):
   - Discover application funds used for specific spending
   - Pattern: GROUP BY fund information

DISCOVERY QUERY REQUIREMENTS:
- ALWAYS use "LIMIT 25" for performance
- Use JOINs to get human-readable names (not just codes)
- Focus on SUM(Amount) for spending totals
- ORDER BY total_amount DESC for ranking
- Include COUNT(*) for transaction frequency insights

CONTEXT AWARENESS:
- When user says "breakdown salaries and wages more" after seeing category analysis, use categoryId=1 (Salaries And Wages)
- When user says "detail on Other Expenditures", use categoryId=4 (Other Expenditures)
- Remember the agency from previous context (don't re-lookup)

EXAMPLE DRILL-DOWN QUERIES:

For "breakdown salaries and wages more" with UT Austin (721):
\`\`\`sql
SELECT 
  comp."Comptroller_Object_Name" AS expense_type,
  SUM(p."Amount") AS total_amount,
  COUNT(*) AS payment_count
FROM "payments" p
JOIN "comptrollerCodes" comp ON p."Comptroller_Object_Num" = comp."Comptroller_Object_Num"
WHERE p."Agency_CD" = 721 
  AND p."CatCode" = 1
GROUP BY comp."Comptroller_Object_Name"
ORDER BY total_amount DESC
LIMIT 25;
\`\`\`

This DISCOVERS what comptroller objects actually exist for UT Austin salaries rather than assuming specific codes.`,

        prompt: `Generate intelligent drill-down query for: "${originalQuestion}"

Drill-down Type: ${drillDownType}
Base Query Filters: ${JSON.stringify(baseQuery, null, 2)}
Previous Context: ${contextFromPrevious || 'None'}

Generate a DISCOVERY query that finds what actually exists in the data for these criteria.`,

        schema: z.object({
          sqlQuery: z.string().describe('The discovery SQL query with LIMIT 25'),
          explanation: z.string().describe('Explanation of what this query discovers'),
          discoveryType: z.string().describe('What type of breakdown this provides'),
          expectedColumns: z.array(z.string()).describe('Expected column names in results'),
          businessContext: z.string().describe('Business context of what this analysis reveals'),
          isValid: z.boolean(),
          usesDiscoveryPattern: z.boolean().describe('Whether this uses discovery pattern vs assumed codes')
        })
      });

      return {
        ...result.object,
        toolUsed: 'generateDrillDownQueryTool',
        drillDownType,
        discoversActualData: true
      };

    } catch (e) {
      console.error('Error generating drill-down query:', e);
      return {
        sqlQuery: '',
        explanation: 'Failed to generate drill-down query',
        discoveryType: 'error',
        expectedColumns: [],
        businessContext: '',
        isValid: false,
        usesDiscoveryPattern: false,
        error: 'An error occurred while generating the drill-down query'
      };
    }
  },
});

export const prepareBulkDownloadTool = tool({
  description: 'Prepare SQL query for bulk CSV download without executing it. Shows download button immediately.',
  parameters: z.object({
    naturalLanguageQuery: z.string(),
    resolvedEntities: z.object({
      agencyIds: z.array(z.number()).optional(),
      categoryIds: z.array(z.number()).optional(),
      fundIds: z.array(z.number()).optional(),
      payeeIds: z.array(z.number()).optional(),
      appropriationIds: z.array(z.number()).optional(),
      comptrollerIds: z.array(z.number()).optional(),
      applicationFundIds: z.array(z.number()).optional(),
      dateRange: z.object({
        start: z.string(),
        end: z.string()
      }).optional()
    }).optional(),
    filename: z.string().describe('Suggested filename for the CSV download')
  }),
  execute: async ({ naturalLanguageQuery, resolvedEntities, filename }) => {
    try {
      // Generate SQL without executing - just prepare the query
      const sqlResult = await generateObject({
        model: openai('gpt-4.1'),
        system: DATABASE_SCHEMA_CONTEXT + `
        
        BULK DOWNLOAD REQUIREMENTS:
        - NO ROW LIMITS - Remove all LIMIT clauses
        - Generate queries for complete datasets
        - Optimize for CSV export format
        - Use clear column names for CSV headers
        - Include all relevant data for analysis
        
        ENTITY RESOLUTION INTEGRATION:
        - Use provided entity IDs directly in WHERE clauses
        - Generate precise queries with exact ID matching
        
        CSV-OPTIMIZED QUERIES:
        - Select human-readable names alongside IDs
        - Include date formatting for Excel compatibility  
        - Order by logical columns (date, amount desc, name)
        - Ensure column names are CSV-friendly (no special chars)`,
        
        prompt: `Generate optimized PostgreSQL query for bulk CSV download: "${naturalLanguageQuery}"
        
        Resolved Entities: ${JSON.stringify(resolvedEntities || {}, null, 2)}
        
        REQUIREMENTS:
        - NO LIMIT clause - return complete dataset
        - CSV-friendly column names and formatting
        - Include both codes and human-readable names
        - Optimized for data analysis and reporting`,
        
        schema: z.object({
          sqlQuery: z.string(),
          explanation: z.string(),
          estimatedRows: z.number(),
          csvColumns: z.array(z.string()),
          entityContext: z.string()
        })
      });

      // Return query preparation without execution
      return {
        success: true,
        prepared: true,
        sqlQuery: sqlResult.object.sqlQuery,
        csvColumns: sqlResult.object.csvColumns,
        filename: filename || 'texas_doge_data.csv',
        entityContext: sqlResult.object.entityContext,
        estimatedRows: sqlResult.object.estimatedRows,
        explanation: sqlResult.object.explanation
      };

    } catch (e) {
      console.error('Bulk download preparation error:', e);
      return { 
        error: 'Failed to prepare bulk download query',
        suggestion: 'Try a more specific query or contact support for large datasets'
      };
    }
  },
});