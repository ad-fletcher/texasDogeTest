import { tool } from 'ai';
    import { z } from 'zod';
    import { supabase } from '../supabase';

    export const getAgencyCodeTool = tool({
      description: 'Get the agency code for an agency name. Uses fuzzy search to return agencies from the database with fuzzy search.',
      parameters: z.object({
        searchTerm: z.string().describe('The name of the agency to search for.'),
      }),
      execute: async ({ searchTerm }) => {
        try {
          console.log('search_term', searchTerm);
          const { data, error } = await supabase.rpc('search_agencies_case_insensitive', {
            search_term: searchTerm,
          });
          console.log('data', data);

          if (error) {
            console.error('Supabase RPC error:', error);
            return { result: `Error: Failed to query the database.` };
          }

          if (!data || data.length === 0) {
            return { result: `No agency found for "${searchTerm}".` };
          }

          if (data.length === 1) {
            const item = data[0];
            return { result: `The agency code for ${item.agency_name} is ${item.agency_cd}.` };
          }

          const agencyList = data
            .map(
              (item: { agency_name: string; agency_cd: number }) =>
                `${item.agency_name} (Code: ${item.agency_cd})`,
            )
            .join(', ');

          return { result: `Found multiple possible agencies for "${searchTerm}": ${agencyList}.` };
        } catch (e) {
          console.error('Error executing tool:', e);
          return { result: `An unexpected error occurred.` };
        }
      },
    });


    export const getApplicationFundCodeTool = tool({
      description: 'Get the application fund code for a fund name. Uses fuzzy search to return application funds from the database.',
      parameters: z.object({
        searchTerm: z.string().describe('The name of the application fund to search for.'),
      }),
      execute: async ({ searchTerm }) => {
        try {
          const { data, error } = await supabase.rpc('search_application_funds_case_insensitive', {
            search_term: searchTerm,
          });
    
          if (error) {
            console.error('Supabase RPC error:', error);
            return { result: `Error: Failed to query the database.` };
          }
    
          if (!data || data.length === 0) {
            return { result: `No application fund found for "${searchTerm}".` };
          }
    
          if (data.length === 1) {
            const item = data[0];
            return { result: `The application fund code for ${item.appd_fund_num_name} is ${item.appd_fund_num}.` };
          }
    
          const fundList = data
            .map(
              (item: { appd_fund_num_name: string; appd_fund_num: number }) =>
                `${item.appd_fund_num_name} (Code: ${item.appd_fund_num})`,
            )
            .join(', ');
    
          return { result: `Found multiple possible application funds for "${searchTerm}": ${fundList}.` };
        } catch (e) {
          console.error('Error executing tool:', e);
          return { result: `An unexpected error occurred.` };
        }
      },
    });

// Appropriation Code Tool
export const getAppropriationCodeTool = tool({
  description: 'Get the appropriation number for an appropriation name. Uses fuzzy search to return appropriations from the database.',
  parameters: z.object({
    searchTerm: z.string().describe('The name of the appropriation to search for.'),
  }),
  execute: async ({ searchTerm }) => {
    try {
      const { data, error } = await supabase.rpc('search_appropriations_case_insensitive', {
        search_term: searchTerm,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { result: `Error: Failed to query the database.` };
      }

      if (!data || data.length === 0) {
        return { result: `No appropriation found for "${searchTerm}".` };
      }

      if (data.length === 1) {
        const item = data[0];
        return { result: `The appropriation number for ${item.appropriation_name} is ${item.appropriation_number}.` };
      }

      const appropriationList = data
        .map(
          (item: { appropriation_name: string; appropriation_number: string }) =>
            `${item.appropriation_name} (Number: ${item.appropriation_number})`,
        )
        .join(', ');

      return { result: `Found multiple possible appropriations for "${searchTerm}": ${appropriationList}.` };
    } catch (e) {
      console.error('Error executing tool:', e);
      return { result: `An unexpected error occurred.` };
    }
  },
});

// Category Code Tool
export const getCategoryCodeTool = tool({
  description: 'Get the category code for a category name. Uses fuzzy search to return categories from the database.',
  parameters: z.object({
    searchTerm: z.string().describe('The name of the category to search for.'),
  }),
  execute: async ({ searchTerm }) => {
    try {
      const { data, error } = await supabase.rpc('search_categories_case_insensitive', {
        search_term: searchTerm,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { result: `Error: Failed to query the database.` };
      }

      if (!data || data.length === 0) {
        return { result: `No category found for "${searchTerm}".` };
      }

      if (data.length === 1) {
        const item = data[0];
        return { result: `The category code for ${item.category} is ${item.catcode}.` };
      }

      const categoryList = data
        .map(
          (item: { category: string; catcode: string }) =>
            `${item.category} (Code: ${item.catcode})`,
        )
        .join(', ');

      return { result: `Found multiple possible categories for "${searchTerm}": ${categoryList}.` };
    } catch (e) {
      console.error('Error executing tool:', e);
      return { result: `An unexpected error occurred.` };
    }
  },
});

// Fund Code Tool
export const getFundCodeTool = tool({
  description: 'Get the fund number for a fund description. Uses fuzzy search to return funds from the database.',
  parameters: z.object({
    searchTerm: z.string().describe('The description of the fund to search for.'),
  }),
  execute: async ({ searchTerm }) => {
    try {
      const { data, error } = await supabase.rpc('search_funds_case_insensitive', {
        search_term: searchTerm,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { result: `Error: Failed to query the database.` };
      }

      if (!data || data.length === 0) {
        return { result: `No fund found for "${searchTerm}".` };
      }

      if (data.length === 1) {
        const item = data[0];
        return { result: `The fund number for ${item.fund_description} is ${item.fund_num}.` };
      }

      const fundList = data
        .map(
          (item: { fund_description: string; fund_num: number }) =>
            `${item.fund_description} (Number: ${item.fund_num})`,
        )
        .join(', ');

      return { result: `Found multiple possible funds for "${searchTerm}": ${fundList}.` };
    } catch (e) {
      console.error('Error executing tool:', e);
      return { result: `An unexpected error occurred.` };
    }
  },
});

// Payee Code Tool
export const getPayeeCodeTool = tool({
  description: 'Get the payee ID for a payee name. Uses fuzzy search to return payees from the database.',
  parameters: z.object({
    searchTerm: z.string().describe('The name of the payee to search for.'),
  }),
  execute: async ({ searchTerm }) => {
    try {
      const { data, error } = await supabase.rpc('search_payees_case_insensitive', {
        search_term: searchTerm,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { result: `Error: Failed to query the database.` };
      }

      if (!data || data.length === 0) {
        return { result: `No payee found for "${searchTerm}".` };
      }

      if (data.length === 1) {
        const item = data[0];
        return { result: `The payee ID for ${item.payee_name} is ${item.payee_id}.` };
      }

      const payeeList = data
        .map(
          (item: { payee_name: string; payee_id: string }) =>
            `${item.payee_name} (ID: ${item.payee_id})`,
        )
        .join(', ');

      return { result: `Found multiple possible payees for "${searchTerm}": ${payeeList}.` };
    } catch (e) {
      console.error('Error executing tool:', e);
      return { result: `An unexpected error occurred.` };
    }
  },
})    




// Comptroller Code Tool
export const getComptrollerCodeTool = tool({
  description: 'Get the comptroller object number for a comptroller object name. Uses fuzzy search to return comptroller objects from the database.',
  parameters: z.object({
    searchTerm: z.string().describe('The name of the comptroller object to search for.'),
    
  }),
  execute: async ({ searchTerm }) => {
    try {
      const { data, error } = await supabase.rpc('search_comptroller_case_insensitive', {
        search_term: searchTerm,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { result: `Error: Failed to query the database.` };
      }

      if (!data || data.length === 0) {
        return { result: `No comptroller object found for "${searchTerm}".` };
      }

      if (data.length === 1) {
        const item = data[0];
        return { result: `The comptroller object number for ${item.comptroller_object_name} is ${item.comptroller_object_num}.` };
      }

      const comptrollerList = data
        .map(
          (item: { comptroller_object_name: string; comptroller_object_num: number }) =>
            `${item.comptroller_object_name} (Number: ${item.comptroller_object_num})`,
        )
        .join(', ');

      return { result: `Found multiple possible comptroller objects for "${searchTerm}": ${comptrollerList}.` };
    } catch (e) {
      console.error('Error executing tool:', e);
      return { result: `An unexpected error occurred.` };
    }
  },
});





