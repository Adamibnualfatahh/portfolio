import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
    schema: ({ image }) => z.object({
        title: z.string(),
        description: z.string(),
        publishDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: image().optional(),
        author: z.object({
            name: z.string().default('Adam Ibnu'),
        }).optional(),
        tags: z.array(z.string()).optional(),
        readDuration: z.number().optional(),
        ShowReadingTime: z.boolean().optional(),
        layout: z.string().optional(), // Retaining for legacy compatibility, though not used in collections
    }),
});

export const collections = { blog };
