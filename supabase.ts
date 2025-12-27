
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vytaqltyavifnddqrrfo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dGFxbHR5YXZpZm5kZHFycmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDI2MzQsImV4cCI6MjA4MjQxODYzNH0.TufGDnfSa6LKV3dbirb3rSYtSeMV7O10kRwvvImBNRw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helpers para busca de dados
export const getCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('order', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err: any) {
    console.error("Erro ao buscar categorias:", err);
    if (err.code === 'PGRST205') return "__DB_MISSING__";
    return [];
  }
};

export const getProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err: any) {
    console.error("Erro ao buscar produtos:", err);
    if (err.code === 'PGRST205') return "__DB_MISSING__";
    return [];
  }
};

// Configurações (WhatsApp, etc)
export const getSetting = async (key: string) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (error) throw error;
    return data?.value || null;
  } catch (err: any) {
    console.error(`Erro ao buscar setting ${key}:`, err);
    if (err.code === 'PGRST205') return "__DB_MISSING__";
    return null;
  }
};

export const updateSetting = async (key: string, value: string) => {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value }, { onConflict: 'key' });
    
    if (error) throw error;
  } catch (err: any) {
    console.error("Erro ao atualizar configuração:", err);
    throw err;
  }
};

// CRUD Categorias
export const upsertCategory = async (category: any) => {
  const { data, error } = await supabase
    .from('categories')
    .upsert(category)
    .select();
  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: string) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// CRUD Produtos
export const upsertProduct = async (product: any) => {
  const { data, error } = await supabase
    .from('products')
    .upsert(product)
    .select();
  if (error) throw error;
  return data;
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  if (error) throw error;
};
