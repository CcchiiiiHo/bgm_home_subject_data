import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

const url = "https://bgm.tv";


interface ImageUrls {
    small: string;
    grid: string;
    large: string;
    medium: string;
    common: string;
}

interface Anime {
    id: string;
    title: string;
    imageUrl: ImageUrls;
    followers: number;
}

interface AnimeCategory {
    type: string;
    items: Anime[];
}

async function fetchAnimeData(url: string): Promise<AnimeCategory[]> {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const animeCategories: AnimeCategory[] = [];

        $('#featuredItems > li').each((_, element) => {
            const type = $(element).find('h2.title').text().trim();
            const items: Anime[] = [];

            $(element).find('.mainItem').each(async(_, item) => {
                const title = $(item).find('a').attr('title')?.trim() || '';
                const href = $(item).find('a').attr('href') || '';
                const id = href.match(/subject\/(\d+)/)?.[1] || '';
                const apiUrl = `https://api.bgm.tv/v0/subjects/${id}`;
                const apiResponse = await axios.get(apiUrl,{
                    headers: {
                        'User-Agent': 'CcchiiiiHo/bgm_home_subject_data (https://github.com/CcchiiiiHo/bgm_home_subject_data)'
                    });
                const imageUrl: ImageUrls = apiResponse.data.images;
                const followers = parseInt($(item).find('.info small.grey').text().replace(/[^0-9]/g, ''), 10);
                items.push({ id, title, imageUrl, followers });
            });

            $(element).find('.subitem.clearit').each(async(_, item) => {
                const title = $(item).find('.title a').text().trim();
                const href = $(item).find('.title a').attr('href') || '';
                const id = href.match(/subject\/(\d+)/)?.[1] || '';
                const apiUrl = `https://api.bgm.tv/v0/subjects/${id}`;
                const apiResponse = await axios.get(apiUrl,{
                    headers: {
                        'User-Agent': 'CcchiiiiHo/bgm_home_subject_data (https://github.com/CcchiiiiHo/bgm_home_subject_data)'
                    });
                const imageUrl: ImageUrls = apiResponse.data.images;
                const followers = parseInt($(item).find('.inner small.grey').text().replace(/[^0-9]/g, ''), 10);
                items.push({ id, title, imageUrl, followers });
            });

            animeCategories.push({ type, items });
        });

        return animeCategories;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

fetchAnimeData(url).then(animeCategories => {
    fs.writeFileSync('animeData.json', JSON.stringify(animeCategories, null, 2));
    console.log('Data saved to animeData.json');
});
