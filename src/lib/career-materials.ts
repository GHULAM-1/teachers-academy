import { createAdminSupabaseClient, createClient } from './supabase';

export type MaterialType = 'resume' | 'cover_letter' | 'linkedin' | 'outreach';

export interface CareerMaterial {
  content: string;
  title: string;
  file_name: string;
  created_at: string;
}

export async function saveCareerMaterialToProfile(
  userId: string,
  materialType: MaterialType,
  content: string,
  title: string
): Promise<void> {
  console.log(`💾 Attempting to save ${materialType} to profile for user ${userId}`);
  console.log(`📝 Content length: ${content.length}`);
  console.log(`📝 Content preview: ${content.substring(0, 100)}...`);
  
  const adminClient = createAdminSupabaseClient();
  
  const file_name = `${materialType}_${new Date().toISOString().split('T')[0]}.txt`;
  const created_at = new Date().toISOString();
  
  const updateData: any = {
    [`${materialType}_content`]: content,
    [`${materialType}_title`]: title,
    [`${materialType}_file_name`]: file_name,
    [`${materialType}_created_at`]: created_at,
    updated_at: new Date().toISOString()
  };

  console.log(`📊 Update data:`, updateData);

  const { error } = await adminClient
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error(`❌ Error saving ${materialType} to profile:`, error);
    throw new Error(`Failed to save ${materialType} to profile`);
  }
  
  console.log(`✅ Successfully saved ${materialType} to profile`);
}

export async function getCareerMaterialFromProfile(
  userId: string,
  materialType: MaterialType
): Promise<CareerMaterial | null> {
  const adminClient = createAdminSupabaseClient();
  
  const { data, error } = await adminClient
    .from('profiles')
    .select(`
      ${materialType}_content,
      ${materialType}_title,
      ${materialType}_file_name,
      ${materialType}_created_at
    `)
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    content: (data as any)[`${materialType}_content`] || '',
    title: (data as any)[`${materialType}_title`] || '',
    file_name: (data as any)[`${materialType}_file_name`] || '',
    created_at: (data as any)[`${materialType}_created_at`] || ''
  };
}

export async function getAllCareerMaterialsFromProfile(
  userId: string
): Promise<Record<MaterialType, CareerMaterial | null>> {
  const adminClient = createAdminSupabaseClient();
  
  const { data, error } = await adminClient
    .from('profiles')
    .select(`
      resume_content, resume_title, resume_file_name, resume_created_at,
      cover_letter_content, cover_letter_title, cover_letter_file_name, cover_letter_created_at,
      linkedin_content, linkedin_title, linkedin_file_name, linkedin_created_at,
      outreach_content, outreach_title, outreach_file_name, outreach_created_at
    `)
    .eq('id', userId)
    .single();

  if (error || !data) {
    return {
      resume: null,
      cover_letter: null,
      linkedin: null,
      outreach: null
    };
  }

  return {
    resume: data.resume_content ? {
      content: data.resume_content,
      title: data.resume_title || 'Resume',
      file_name: data.resume_file_name || 'resume.txt',
      created_at: data.resume_created_at || ''
    } : null,
    cover_letter: data.cover_letter_content ? {
      content: data.cover_letter_content,
      title: data.cover_letter_title || 'Cover Letter',
      file_name: data.cover_letter_file_name || 'cover_letter.txt',
      created_at: data.cover_letter_created_at || ''
    } : null,
    linkedin: data.linkedin_content ? {
      content: data.linkedin_content,
      title: data.linkedin_title || 'LinkedIn Profile',
      file_name: data.linkedin_file_name || 'linkedin.txt',
      created_at: data.linkedin_created_at || ''
    } : null,
    outreach: data.outreach_content ? {
      content: data.outreach_content,
      title: data.outreach_title || 'Outreach Messages',
      file_name: data.outreach_file_name || 'outreach.txt',
      created_at: data.outreach_created_at || ''
    } : null
  };
}

// Client-side version that uses regular client (for browser use)
export async function getAllCareerMaterialsFromProfileClient(
  userId: string
): Promise<Record<MaterialType, CareerMaterial | null>> {
  const client = createClient();
  
  const { data, error } = await client
    .from('profiles')
    .select(`
      resume_content, resume_title, resume_file_name, resume_created_at,
      cover_letter_content, cover_letter_title, cover_letter_file_name, cover_letter_created_at,
      linkedin_content, linkedin_title, linkedin_file_name, linkedin_created_at,
      outreach_content, outreach_title, outreach_file_name, outreach_created_at
    `)
    .eq('id', userId)
    .single();

  if (error || !data) {
    return {
      resume: null,
      cover_letter: null,
      linkedin: null,
      outreach: null
    };
  }

  return {
    resume: data.resume_content ? {
      content: data.resume_content,
      title: data.resume_title || 'Resume',
      file_name: data.resume_file_name || 'resume.txt',
      created_at: data.resume_created_at || ''
    } : null,
    cover_letter: data.cover_letter_content ? {
      content: data.cover_letter_content,
      title: data.cover_letter_title || 'Cover Letter',
      file_name: data.cover_letter_file_name || 'cover_letter.txt',
      created_at: data.cover_letter_created_at || ''
    } : null,
    linkedin: data.linkedin_content ? {
      content: data.linkedin_content,
      title: data.linkedin_title || 'LinkedIn Profile',
      file_name: data.linkedin_file_name || 'linkedin.txt',
      created_at: data.linkedin_created_at || ''
    } : null,
    outreach: data.outreach_content ? {
      content: data.outreach_content,
      title: data.outreach_title || 'Outreach Messages',
      file_name: data.outreach_file_name || 'outreach.txt',
      created_at: data.outreach_created_at || ''
    } : null
  };
}

// Client-side version of save function (for browser use)
export async function saveCareerMaterialToProfileClient(
  userId: string,
  materialType: MaterialType,
  content: string,
  title: string
): Promise<void> {
  const client = createClient();
  
  const file_name = `${materialType}_${new Date().toISOString().split('T')[0]}.txt`;
  const created_at = new Date().toISOString();
  
  const updateData: any = {
    [`${materialType}_content`]: content,
    [`${materialType}_title`]: title,
    [`${materialType}_file_name`]: file_name,
    [`${materialType}_created_at`]: created_at,
    updated_at: new Date().toISOString()
  };

  const { error } = await client
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error(`Error saving ${materialType} to profile:`, error);
    throw new Error(`Failed to save ${materialType} to profile`);
  }
}

export async function saveJobSearchTermsToProfile(
  userId: string,
  jobSearchTerms: string
): Promise<void> {
  const adminClient = createAdminSupabaseClient();
  
  const updateData = {
    job_search_terms: jobSearchTerms,
    updated_at: new Date().toISOString()
  };

  const { error } = await adminClient
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error('Error saving job search terms to profile:', error);
    throw new Error('Failed to save job search terms to profile');
  }
}

export async function getJobSearchTermsFromProfile(
  userId: string
): Promise<string | null> {
  const adminClient = createAdminSupabaseClient();
  
  const { data, error } = await adminClient
    .from('profiles')
    .select('job_search_terms')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.job_search_terms || null;
}

export async function getJobSearchTermsFromProfileClient(
  userId: string
): Promise<string | null> {
  const client = createClient();
  
  const { data, error } = await client
    .from('profiles')
    .select('job_search_terms')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.job_search_terms || null;
}

// Function to generate downloadable file content
export function generateFileContent(content: string, materialType: MaterialType): string {
  const timestamp = new Date().toLocaleString();
  const header = `Generated by Teachers Next - ${materialType.replace('_', ' ').toUpperCase()}\nCreated: ${timestamp}\n\n`;
  
  return header + content;
}

// Function to trigger file download
export async function downloadFile(content: string, fileName: string, fileType: 'txt' | 'pdf' | 'docx' = 'txt'): Promise<void> {
  if (fileType === 'txt') {
    // For text files, use simple download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else if (fileType === 'pdf') {
    // Generate PDF using jsPDF
    const { jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    
    // Set font
    doc.setFont('helvetica');
    doc.setFontSize(12);
    
    // Split content into lines that fit the page width
    const lines = doc.splitTextToSize(content, maxWidth);
    
    let yPosition = margin;
    const lineHeight = 7;
    
    for (let i = 0; i < lines.length; i++) {
      // Check if we need a new page
      if (yPosition > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.text(lines[i], margin, yPosition);
      yPosition += lineHeight;
    }
    
    // Save the PDF
    doc.save(fileName);
  } else if (fileType === 'docx') {
    // Generate DOCX using docx library
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
    
    // Parse content and create document structure
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const children: any[] = [];
    
    for (const line of lines) {
      if (line.startsWith('**') && line.endsWith('**')) {
        // Bold text - treat as heading
        const headingText = line.replace(/\*\*/g, '');
        children.push(
          new Paragraph({
            text: headingText,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          })
        );
      } else if (line.startsWith('•') || line.startsWith('-')) {
        // Bullet points
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 24
              })
            ],
            spacing: { before: 200, after: 200 }
          })
        );
      } else if (line.trim() === '') {
        // Empty line - add spacing
        children.push(
          new Paragraph({
            children: [new TextRun({ text: '' })],
            spacing: { before: 200, after: 200 }
          })
        );
      } else {
        // Regular paragraph
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 24
              })
            ],
            spacing: { before: 200, after: 200 }
          })
        );
      }
    }
    
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children
        }
      ]
    });
    
    // Generate and download the DOCX file
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
} 