export interface CSVDownloadData {
    data: Record<string, unknown>[];
    filename: string;
    columns?: string[];
  }
  
  /**
   * Convert array of objects to CSV string
   */
  export function convertToCSV(data: Record<string, unknown>[], columns?: string[]): string {
    if (!data || data.length === 0) {
      return '';
    }
  
    // Use provided columns or extract from first row
    const headers = columns || Object.keys(data[0]);
    
    // Create CSV header row
    const csvHeaders = headers.map(header => `"${header}"`).join(',');
    
    // Create CSV data rows
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          return '""';
        }
        
        // Handle numbers (including currency)
        if (typeof value === 'number') {
          return value.toString();
        }
        
        // Handle strings (escape quotes)
        const stringValue = value.toString().replace(/"/g, '""');
        return `"${stringValue}"`;
      }).join(',');
    });
  
    return [csvHeaders, ...csvRows].join('\n');
  }
  
  /**
   * Download CSV file to user's computer
   */
  export function downloadCSV({ data, filename, columns }: CSVDownloadData): void {
    const csvContent = convertToCSV(data, columns);
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    // Generate download URL
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    
    // Trigger download
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    URL.revokeObjectURL(url);
  }
  
  /**
   * Format data size for display
   */
  export function formatDataSize(rowCount: number, columnCount: number): string {
    const estimatedSizeKB = Math.ceil((rowCount * columnCount * 20) / 1024); // ~20 chars per field
    
    if (estimatedSizeKB < 1024) {
      return `${estimatedSizeKB} KB`;
    } else {
      return `${(estimatedSizeKB / 1024).toFixed(1)} MB`;
    }
  }
  
  /**
   * Generate filename from query context
   */
  export function generateFilename(query: string, entityContext?: string): string {
    // Clean query for filename
    let filename = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
      
    // Add entity context if available
    if (entityContext) {
      const cleanContext = entityContext
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 20);
      filename = `${filename}_${cleanContext}`;
    }
    
    // Add timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    return `texas_doge_${filename}_${timestamp}`;
  }

/**
 * Server-side CSV download via API
 */
export async function downloadCSVFromServer(sqlQuery: string, filename: string): Promise<void> {
  try {
    const response = await fetch('/api/download-csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sqlQuery,
        filename
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Download failed');
    }

    // Get the CSV content as blob
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Server-side CSV download error:', error);
    throw error;
  }
}

/**
 * Format estimated data size for display
 */
export function formatEstimatedSize(estimatedRows: number, columnCount: number = 10): string {
  const estimatedSizeKB = Math.ceil((estimatedRows * columnCount * 20) / 1024);
  
  if (estimatedSizeKB < 1024) {
    return `~${estimatedSizeKB} KB`;
  } else {
    return `~${(estimatedSizeKB / 1024).toFixed(1)} MB`;
  }
}