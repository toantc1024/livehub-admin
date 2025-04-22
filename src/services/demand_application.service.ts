import supabase from '../supabase/client';

export const getAllDemandApplicationsByDemandId = async (demandId: string) => {
    const { data, error } = await supabase.from('demand_application').select('*').eq('demand_id', demandId);
    if (error) {
        throw new Error(`Error fetching demand applications: ${error.message}`);
    }
    return data;
};

export const getAllDemandApplicationsByDemandIdCSV = async (demandId: string) => {
    const { data, error } = await supabase.from('demand_application').select('*').eq('demand_id', demandId).csv();
    if (error) {
        throw new Error(`Error fetching demand applications CSV: ${error.message}`);
    }
    return data;
};

export const updateDemandApplicationById = async (id: string, application: any) => {
    const { data, error } = await supabase.from('demand_application').update(application).eq('id', id);
    if (error) {
        throw new Error(`Error updating demand application: ${error.message}`);
    }
    return data;
};