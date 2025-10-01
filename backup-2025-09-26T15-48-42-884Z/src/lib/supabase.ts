import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Debug Info:');
console.log('URL:', supabaseUrl || '❌ NOT SET');
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '❌ NOT SET');
console.log('URL type:', typeof supabaseUrl);
console.log('Key type:', typeof supabaseAnonKey);

// Check if we have valid Supabase credentials
const hasValidSupabaseConfig = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== '' &&
  supabaseUrl !== 'your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key' &&
  supabaseUrl.includes('.supabase.co') &&
  supabaseAnonKey.startsWith('eyJ')
);

console.log('✅ Has valid config:', hasValidSupabaseConfig);
console.log('🔧 Fresh start config check:');
console.log('  - URL exists:', !!supabaseUrl);
console.log('  - Key exists:', !!supabaseAnonKey);
console.log('  - URL format OK:', supabaseUrl ? supabaseUrl.includes('.supabase.co') : false);
console.log('  - Key format OK:', supabaseAnonKey ? supabaseAnonKey.startsWith('eyJ') : false);
console.log('  - Is placeholder URL:', supabaseUrl === 'your-project-id.supabase.co');
console.log('  - Is placeholder key:', supabaseAnonKey === 'your-anon-key');

export const supabase = hasValidSupabaseConfig 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

console.log('🚀 Supabase client created:', !!supabase);

if (!supabase) {
  console.log('❌ Supabase client NOT created. Reasons:');
  if (!supabaseUrl) console.log('  - Missing VITE_SUPABASE_URL');
  if (!supabaseAnonKey) console.log('  - Missing VITE_SUPABASE_ANON_KEY');
  if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) console.log('  - Invalid URL format');
  if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) console.log('  - Invalid key format');
  console.log('');
  console.log('💡 To fix this:');
  console.log('  1. Login as operator@travel.com / operator123');
  console.log('  2. Go to Operator Dashboard → GPT Management');
  console.log('  3. Click "setup Supabase for multi-user support"');
  console.log('  4. Follow the setup wizard');
} else {
  console.log('✅ Supabase client successfully created!');
  console.log('🔗 Testing connection...');
  
  // Test the connection
  supabase.from('gpt_models').select('count', { count: 'exact', head: true })
    .then(({ count, error }) => {
      if (error) {
        console.log('❌ Database connection test failed:', error.message);
        console.log('💡 Run the SQL migration in Supabase dashboard!');
      } else {
        console.log('✅ Database connection successful!');
        console.log(`📊 Found ${count || 0} GPT models in database`);
      }
    })
    .catch(err => {
      console.log('❌ Connection test error:', err);
    });
}

// Helper functions for database operations
export const db = {
  // Brands
  async getBrands() {
    console.log('📊 getBrands called, supabase available:', !!supabase);
    if (!supabase) {
      console.log('⚠️ No supabase, throwing error');
      throw new Error('Supabase not configured - check environment variables');
    }
    console.log('🔄 Making supabase request...');
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('📥 Supabase response:', { data, error });
    if (error) {
      console.error('🚨 Supabase query error:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }
    return data;
  },

  async createBrand(brand: Partial<any>) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    const { data, error } = await supabase
      .from('brands')
      .insert([brand])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateBrand(id: string, updates: Partial<any>) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    const { data, error } = await supabase
      .from('brands')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteBrand(id: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    console.log('🔄 Attempting to delete brand with ID:', id);
    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('🚨 Supabase delete error:', error);
      throw new Error(`Database delete failed: ${error.message}`);
    }
    console.log('✅ Brand successfully deleted from database');
  },

  // Companies
  async getCompanies() {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Users
  async getUsers() {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        brands (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Websites
  async getWebsites(brandId?: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    let query = supabase
      .from('websites')
      .select(`
        *,
        brands (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // News Articles
  async getNewsArticles(brandId?: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    let query = supabase
      .from('news_articles')
      .select(`
        *,
        brands!news_articles_brand_id_fkey (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Builder Projects
  async getBuilderProjects(brandId?: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    let query = supabase
      .from('builder_projects')
      .select(`
        *,
        brands (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Agents
  async getAgents(brandId?: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    let query = supabase
      .from('agents')
      .select(`
        *,
        brands (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // GPT Models
  async getGPTModels() {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    const { data, error } = await supabase
      .from('gpt_models')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createGPTModel(gptModel: Partial<any>) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    const { data, error } = await supabase
      .from('gpt_models')
      .insert([{ ...gptModel, created_by: (await supabase.auth.getUser()).data.user?.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateGPTModel(id: string, updates: Partial<any>) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    const { data, error } = await supabase
      .from('gpt_models')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteGPTModel(id: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    const { error } = await supabase
      .from('gpt_models')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async incrementGPTUsage(id: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    const { error } = await supabase
      .from('gpt_models')
      .update({ 
        usage_count: supabase.raw('usage_count + 1'),
        last_used: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  }
};