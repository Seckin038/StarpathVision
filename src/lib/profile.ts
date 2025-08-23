import { supabase } from './supabaseClient';

export const getCoreValues = async () => {
  const { data, error } = await supabase.from('core_values').select('*');
  if (error) throw error;
  return data;
};

export const getMyProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
  return data;
};

export const updateMyProfile = async (updates: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single();
  if (error) throw error;
  return data;
};