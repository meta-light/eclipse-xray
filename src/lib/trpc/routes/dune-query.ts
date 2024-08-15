import { t } from "$lib/trpc/t";
import { DUNE_KEY } from "$env/static/private";

const query = { id: 3942875, path: 6633021 };

export const duneQuery = t.procedure
    .query(async () => {
        const url = `https://api.dune.com/api/v1/query/${query.id}/results`;
        const options = {
            method: 'GET',
            headers: {
                'X-Dune-Api-Key': DUNE_KEY
            }
        };
        
        try {
            const response = await fetch(url, options);
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
            const data = await response.json();
            return data.result.rows[0];
        } 
        catch (err) {
            console.error("Error executing Dune query:", err);
            throw err;
        }
    });