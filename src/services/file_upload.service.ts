import supabase from "../supabase/client";

export const uploadFile = async (
  file: File,
  bucket: string = "images"
): Promise<string> => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = await supabase.storage.from(bucket).getPublicUrl(filePath);

    return publicUrl;
  } catch (error: any) {
    throw new Error(`Error uploading file: ${error.message}`);
  }
};
