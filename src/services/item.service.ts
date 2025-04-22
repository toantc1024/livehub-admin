import supabase from "../supabase/client";
import { ItemType } from "../types/Item";


export const getItemsByType = async (type: ItemType, range: number[]) => {
    const { data, error } = await supabase.from('item').select('*').eq('item_type', type).range(range[0], range[1]);
    return data;
}

export const updateItemById = async (id: string, item: any) => {
    const { data, error } = await supabase.from('item').update(item).eq('id', id);
    return data;
}

export const getAllServices = async () => {
    const { data, error } = await supabase.from('item').select('*').eq('item_type', 'service');
    return data;
}

export const getServiceById = async (id: string) => {
    const { data, error } = await supabase.from('item').select('*').eq('id', id).eq('item_type', 'service');
    return { data, error };
}

export const updateServiceById = async (id: string, service: any) => {
    const { data, error } = await supabase.from('item').update(service).eq('id', id).eq('item_type', 'service');
    return { data, error };
}


export const getAllServiceCSV = async () => {
    const { data, error } = await supabase.from('item').select('*').eq('item_type', 'service').csv();
    return { data, error };
}

export const getAllDemands = async () => {
    const { data, error } = await supabase.from('item').select('*').eq('item_type', 'demand');
    return data;
}

export const getDemandById = async (id: string) => {
    const { data, error } = await supabase.from('item')
        .select('*')
        .eq('id', id)
        .eq('item_type', 'demand');
    return { data, error };
}

export const updateDemandById = async (id: string, demand: any) => {

    const { data, error } = await supabase.from('item').update(demand).eq('id', id).eq('item_type', 'demand');
    return { data, error };
}

export const getAllDemandsCSV = async () => {
    const { data, error } = await supabase.from('item').select('*').eq('item_type', 'demand').csv();
    return { data, error };
}