import supabase from "../supabase/client";

export const getAllServiceRentalByServiceIdCSV = async (serviceId: string) => {
    try {
        const { data, error } = await supabase
            .from('service_rental')
            .select('*')
            .eq('service_id', serviceId)
            .csv();

        if (error) throw error;

        return data;
    } catch (error: any) {
        throw new Error(`Error fetching service rentals: ${error.message}`);
    }
}



export const getAllServiceRentalByServiceId = async (serviceId: string) => {
    try {
        const { data, error } = await supabase
            .from('service_rental')
            .select('*')
            .eq('service_id', serviceId)
    

        if (error) throw error;

        return data;
    } catch (error: any) {
        throw new Error(`Error fetching service rentals: ${error.message}`);
    }
}

export const updateServiceRentalById = async (serviceRentalId: string, serviceRental: any) => {
    try {
        const { data, error } = await supabase
            .from('service_rental')
            .update(serviceRental)
            .eq('id', serviceRentalId);

        if (error) throw error;

        return data;
    } catch (error: any) {
        throw new Error(`Error updating service rental: ${error.message}`);
    }
}
