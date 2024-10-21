import axios from "axios";
import { t } from "$lib/trpc/t";
import yaml from "js-yaml";

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/Eclipse-Laboratories-Inc/program-registry/main/programs.yaml';

export const programs = t.procedure
    .query(async () => {
        try {
            const response = await axios.get(GITHUB_RAW_URL);
            const yamlData = response.data;
            const jsonData = yaml.load(yamlData) as any[];
            return jsonData;
        }
        catch (error) {console.error("Error fetching and parsing Eclipse program registry:", error); return null;}
    });
