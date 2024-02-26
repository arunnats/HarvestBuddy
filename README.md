# Movie-Match: Revolutionizing Your Movie-Watching Experience
## Built at the Bit N Build International Hackathon Finals (Feb 24, 25 2024)

Introducing Harvest Buddy, a software solution crafted by our team, The Hackstreet Boys. Harvest Buddy stands as a smart inventory and alert system poised to redefine the agricultural realm. With SMS notifications providing real-time updates on inventory consumption and crop growth, coupled with AI-powered recommendations for optimal produce utilization and market value assessments, Harvest Buddy brings innovation to the heart of farming operations. The application's engaging retro video game-themed user interface adds a touch of nostalgia to its modern functionalities, making Harvest Buddy not just a tool but a game-changer in the dynamic landscape of agriculture. 

[Preview](http://harvestbuddy.arunnats.com/)

![Screenshot 2024-02-26 112243](https://github.com/arunnats/HarvestBuddy/assets/118368673/f1975b7c-469a-4964-90cc-71bdb6b1e58a)

<a name="description"></a>
## Description

### Extensive Movie Database

Movie-Match boasts an extensive movie database, housing a vast collection of films from various genres, languages, and eras. The database is updated daily using a python script and gets the daily dataset released by IMDB, uses api calls to OMDB and TMDB (movie data aggregaion sites) and updates the MongoDB database everyday. Thus, the database has the potential to host every single movie present on IMDB. The database hosts, all the details of the movie, the posters and the streaming service information.

(As of 06-02-2024 - Database has data from 1940 to mid 2023 in no particular order)

### Advanced AI Recommendations

Unleashing the power of OpenAI's GPT-4-turbo, Movie-Match offers an AI recommendation engine. This system analyzes user preferences and deliver tailor-made movie suggestions. Experience a new era of personalized content curation, ensuring every film recommendation resonates with your unique taste.

### Intuitive Search Functionality

Navigating the extensive cinematic landscape is simplified with Movie-Match's intuitive search functionality. Users can effortlessly explore movies, whether searching by genre, language, or release year. Our platform empowers users to effortlessly identify the perfect movie for any mood. Using our advanced search function the user can choose movies based on all parameters and the resutls are returned taking the weighted average of their IMDB and RT ratings.

### Regular Database Updates

Our commitment to providing up-to-date movie data remains steadfast. Daily updates, facilitated by a Python script, ensure that Movie-Match's database reflects the dynamic changes in the film industry.

### Sorting based on Genre and Streaming servive

Our code randomizes the top 200 movies in each Genre and Streaming Service so you can get a new pick every single day!

### Movie Info pages

Each movie has its own info page with all the details, a review carousel, buttons redirecting them to their IMDB page, information about the streaming service and the intricate details of hte movie found from IMDB, TMDB and OMDB.

<a name="features"></a>
## Features

- Extensive movie database spanning various genres, languages and OTTs
- AI recommendation engine powered by OpenAI's GPT-4-turbo
- Daily updates to the movie database to reflect the latest information using python scripts
- Light/dark mode toggle for personalized viewing preferences
- Preview for a quick glimpse of movie details
- In depth list of all movie details for a particular movie
- IMDB and Rotten Tomatoes ratings
- Sorting based on OTT and filtering family friendly content
- Sorted and randomized movies based on genre and streaming service, which are sorted by a - weighted average of RT and IMDB scores
- Movie information page with all details about each movie

<a name="tech-stack"></a>
## Tech Stack

- Database: MongoDB
- Backend: Javascript, Python
- Framworks: NodeJS, FuseJS
- AI Engine: OpenAI's GPT-4-turbo
- API Integration: IMDB, OMDB, TMDB

<a name="authors"></a>
## Authors

- [@arunnats](https://www.arunnats.com/)
- [@Hafeez-hm](https://github.com/Hafeez-hm)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
