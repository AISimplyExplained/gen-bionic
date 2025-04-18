'use server'

import { generateObject, NoObjectGeneratedError } from 'ai';
import { openai } from '@ai-sdk/openai';
import { Slide, ContentItem } from '@/lib/types';
import { z } from 'zod';

// Define the Zod schema for content items with the correct structure
const contentItemSchema = z.object({
    type: z.enum(['paragraph', 'list', 'quote', 'image']),
    content: z.string().optional(),
    list: z.array(z.string()).optional(),
    quote: z.string().optional(),
    imagePrompt: z.string().optional(),
});

// Define the Zod schema for slides with more meaningful slide types
const slideSchema = z.object({
    title: z.string(),
    type: z.enum(['title', 'overview', 'detail', 'comparison', 'statistics', 'case-study', 'conclusion']),
    content: z.array(contentItemSchema),
    contentType: z.string() // Allow any string for contentType
});

export async function generateSlides(topic: string, slideCount: number = 5): Promise<Slide[]> {
    // Ensure slide count is within reasonable limits
    const validatedSlideCount = Math.min(Math.max(2, slideCount), 10);

    try {
        // Create a schema with the exact slide count needed
        const presentationSchema = z.object({
            slides: z.array(slideSchema).length(validatedSlideCount)
        });

        const { object } = await generateObject({
            model: openai('gpt-4o'),
            schema: presentationSchema,
            prompt: `Create a professional, detailed presentation with exactly ${validatedSlideCount} slides about: ${topic}. Make it comprehensive, data-driven, and include specific details, examples, and statistics where appropriate.`,
            system: `You are an expert presentation designer known for creating richly formatted, visually diverse, and content-rich presentations.
            
            Create a comprehensive presentation about "${topic}" with exactly ${validatedSlideCount} slides following these strict requirements:
            
            SLIDE TYPES AND STRUCTURE:
            1. First slide MUST be a 'title' type with a compelling introduction
            2. Second slide MUST be an 'overview' type that outlines the key points
            3. Middle slides must use a mix of these informative types:
               - 'detail': In-depth explanation of a specific aspect
               - 'comparison': Compare/contrast different perspectives or approaches
               - 'statistics': Present specific numbers, data points, and research findings
               - 'case-study': Real-world example or application
            4. Last slide MUST be a 'conclusion' type with actionable takeaways
            
            CONTENT FORMAT REQUIREMENTS:
            Each slide MUST contain a mix of different content items with these types:
            - 'paragraph': A type with a 'content' field containing text paragraphs
            - 'list': A type with a 'list' array of numbered or sequential items
            - 'quote': A type with a 'quote' field containing a quotation
            - 'image': A type with an 'imagePrompt' field containing a detailed prompt for image generation

            If a slide includes an image, it may only contain two content items:
            - image
            - additional content item (either 'paragraph', 'list', or 'quote')

            IMPORTANT: Each content item must ONLY include the appropriate field based on its type:
            - paragraph items must have a 'content' field
            - list items must have a 'list' array
            - quote items must have a 'quote' field
            - image items must have an 'imagePrompt' field
            
            For contentType, use a descriptive string like "Mix of paragraph and list"
            
            IMAGE REQUIREMENTS:
            - Include ONLY 1-2 images TOTAL across all slides combined
            - Choose only the most important slide(s) to include an image - preferably one that would benefit most from visual representation
            - Put images in content-focused slides, not the title or conclusion
            - Image prompts should be detailed, visual, and specific
            - Make image prompts realistic and clear - describe the exact visualization needed
            - For charts/graphs, describe exactly what data should be shown
            
            CONTENT QUALITY REQUIREMENTS:
            1. Include SPECIFIC facts, statistics and examples (use real numbers, dates, names)
            2. Every slide (except title) MUST use at least 2 different content item types
            3. Use markdown formatting (*italics* for emphasis, **bold** for key points)
            
            EXAMPLES OF GOOD CONTENT ITEMS:
            1. paragraph: {"type": "paragraph", "content": "The global AI market reached **$136.6 billion** in 2022."}
            2. list: {"type": "list", "list": ["Research phase (2-3 months)", "Development phase (4-6 months)"]}
            3. quote: {"type": "quote", "quote": ""Artificial intelligence is the new electricity." - Andrew Ng"}
            4. image: {"type": "image", "imagePrompt": "A professional bar chart showing AI market growth from 2018-2022, with $136.6B highlighted for 2022"}
            
            The response MUST have exactly ${validatedSlideCount} slides with varied content types.`,
            temperature: 0.7,
        });

        // Process the slides to normalize the content structure for our components
        const processedSlides = object.slides.map((slide: any) => {
            return {
                ...slide,
                content: slide.content.map((item: any) => {
                    switch (item.type) {
                        case 'paragraph':
                            return {
                                type: 'paragraph',
                                content: item.content || ''
                            };
                        case 'list':
                            return {
                                type: 'list',
                                list: item.list || []
                            };
                        case 'quote':
                            return {
                                type: 'quote',
                                quote: item.quote || ''
                            };
                        case 'image':
                            return {
                                type: 'image',
                                imagePrompt: item.imagePrompt || ''
                            };
                        default:
                            return {
                                type: 'paragraph',
                                content: ''
                            };
                    }
                })
            };
        });

        // Return the processed slides
        return processedSlides as Slide[];
    } catch (error) {
        console.error('Error generating slides:', error);

        // Return a basic error slide if generation fails
        return [{
            title: 'Slide Generation Error',
            type: 'title',
            content: [{ type: 'paragraph', content: 'Sorry, there was an error generating your presentation. Please try again.' }],
            contentType: 'mixed'
        }];
    }
} 