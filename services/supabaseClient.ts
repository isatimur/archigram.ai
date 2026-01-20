import { createClient } from '@supabase/supabase-js';
import { CommunityDiagram } from '../types.ts';

// Credentials provided by the user
const SUPABASE_URL = 'https://hcuqmiikexwvfnjreihg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Se-nCOZXhf903JD57PKETg_mAS5LCYg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface DbDiagram {
    id: string;
    created_at: string;
    title: string;
    author: string;
    description: string;
    code: string;
    tags: string[];
    likes: number;
    views: number;
}

// Helper to handle error objects cleanly in console
const logSupabaseError = (context: string, error: any) => {
    const msg = error?.message || JSON.stringify(error);
    console.warn(`[Supabase] ${context}: ${msg}`);
};

export const fetchCommunityDiagrams = async (): Promise<CommunityDiagram[]> => {
    try {
        const { data, error } = await supabase
            .from('community_diagrams')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            // We use warn here because the app has a fallback to static data
            logSupabaseError('Fetch failed, falling back to local data', error);
            return [];
        }

        if (!data) return [];

        return data.map((d: DbDiagram) => ({
            id: d.id,
            title: d.title,
            author: d.author || 'Anonymous',
            description: d.description || '',
            code: d.code,
            likes: d.likes || 0,
            views: d.views || 0,
            tags: d.tags || [],
            createdAt: new Date(d.created_at).toLocaleDateString()
        }));
    } catch (e) {
        logSupabaseError('Client exception', e);
        return [];
    }
};

export const publishDiagram = async (diagram: {
    title: string;
    author: string;
    description: string;
    code: string;
    tags: string[];
}): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('community_diagrams')
            .insert([
                {
                    title: diagram.title,
                    author: diagram.author,
                    description: diagram.description,
                    code: diagram.code,
                    tags: diagram.tags,
                    likes: 0,
                    views: 0
                }
            ]);

        if (error) {
            logSupabaseError('Publish failed', error);
            return false;
        }
        return true;
    } catch (e) {
        logSupabaseError('Publish exception', e);
        return false;
    }
};

export const updateDiagramLikes = async (id: string, count: number): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('community_diagrams')
            .update({ likes: count })
            .eq('id', id);

        if (error) {
            logSupabaseError('Like update failed', error);
            return false;
        }
        return true;
    } catch (e) {
        logSupabaseError('Like exception', e);
        return false;
    }
};