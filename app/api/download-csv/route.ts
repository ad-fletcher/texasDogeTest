import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { sqlQuery, filename } = await request.json();
    
    // Validate request
    if (!sqlQuery || !sqlQuery.trim().toUpperCase().startsWith('SELECT')) {
      return NextResponse.json(
        { error: 'Invalid SQL query provided' },
        { status: 400 }
      );
    }

    // Execute the bulk query server-side
    // TEMPORARY: Use regular analytics function since bulk function is having 520 errors
    console.log('Using execute_analytics_query as fallback...');
    const { data, error } = await supabase.rpc('execute_analytics_query', {
      query_text: sqlQuery
    });
    
    if (error) {
      console.error('Bulk query execution error:', error);
      return NextResponse.json(
        { error: 'Database query failed: ' + error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No data returned from query' },
        { status: 404 }
      );
    }

    // Process results for CSV format
    const processedResults = data.map((row: Record<string, unknown>) => {
      const processedRow = { ...row };
      
      // Format dates for CSV/Excel compatibility
      if (processedRow.date) {
        processedRow.date = new Date(processedRow.date as string | number | Date).toISOString().split('T')[0];
      }
      if (processedRow.month) {
        processedRow.month = new Date(processedRow.month as string | number | Date).toISOString().split('T')[0];
      }
      
      return processedRow;
    });

    // Generate CSV content server-side
    const headers = Object.keys(processedResults[0]);
    const csvHeaders = headers.map(header => `"${header}"`).join(',');
    
    const csvRows = processedResults.map((row: Record<string, unknown>) => {
      return headers.map(header => {
        const value = row[header];
        
        if (value === null || value === undefined) {
          return '""';
        }
        
        if (typeof value === 'number') {
          return value.toString();
        }
        
        const stringValue = value.toString().replace(/"/g, '""');
        return `"${stringValue}"`;
      }).join(',');
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    // Return CSV as downloadable file
    const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${cleanFilename}"`,
        'Content-Length': csvContent.length.toString(),
      },
    });

  } catch (error) {
    console.error('CSV download API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during CSV generation' },
      { status: 500 }
    );
  }
}
