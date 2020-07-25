// const fetch = require('node-fetch');

const FILE_URL = "http://norvig.com/big.txt";
const API_URL = "https://dictionary.yandex.net/api/v1/dicservice.json/lookup";
const API_KEY = "dict.1.1.20170610T055246Z.0f11bdc42e7b693a.eefbde961e10106a4efa7d852287caa49ecc68cf";
const skippedWords = ["into", "there", "were", "although", "even", "though", "while", "unless", "until", "provided", "that", "assuming", "that", "case", "lest", "than", "rather", "than", "whether", "much", "whereas", "after", "long", "soon", "before", "time", "that", "once", "since", "till", "until", "when", "whenever", "while", "because", "since", "that", "order", "that", "what", "whatever", "which", "whichever", "whoever", "whom", "whomever", "whose", "though", "where", "wherever", "just", "both", "hardly", "when", "scarcely", "when", "either", "neither", "then", "what", "with", "whether", "only", "also", "sooner", "than", "rather", "than", "also", "besides", "furthermore", "likewise", "moreover", "Similar", "however", "nevertheless", "nonetheless", "still", "conversely", "instead", "otherwise", "rather", "Similar", "accordingly", "consequently", "hence", "meanwhile", "then", "therefore", "thus"];
const body = document.querySelector("body");
const outputWindow = document.querySelector("#json");
// Async get data from dictionary lookup
const getDictLookup = async (word, count) => {
    const dictresp = await fetch(`${API_URL}?key=${API_KEY}&lang=en-en&text=${word}`);
    const dictData = await dictresp.json();
    const synonyms = dictData.def[0].tr.map(data => data.text);
    const pos = dictData.def[0].pos;
    return {
        word,
        output: {
            count,
            pos: dictData.def.length > 0 ? pos : null,
            synonyms: dictData.def.length > 0 ? synonyms : null,
        }
    };
}

// fetch file url
const getData = async () => {
    // const response = await fetch(FILE_URL);
    // const data = await response.text();
    const data = `the uniformity of the middle west there was a certain monotony about pioneering in the northwest and on the middle border. as the long stretches of land were cleared or prepared for the plow, they were laid out like checkerboards into squares of forty, eighty, one hundred sixty, or more acres, each the seat of a homestead. there was a striking uniformity also about the endless succession of fertile fields spreading far and wide under the hot summer sun. no majestic mountains relieved the sweep of the prairie. few monuments of other races and antiquity were there to awaken curiosity about the region. no sonorous bells in old missions rang out the time of day. the chaffering red man bartering blankets and furs for powder and whisky had passed farther on. the population was made up of plain farmers and their families engaged in severe and unbroken labor, chopping down trees, draining fever-breeding swamps, breaking new ground, and planting from year to year the same rotation of crops. nearly all the settlers were of native american stock into whose frugal and industrious lives the later irish and german immigrants fitted, on the whole, with little friction. even the dutch oven fell before the cast-iron cooking stove. happiness and sorrow, despair and hope were there, but all encompassed by the heavy tedium of prosaic sameness.`;

    // Create word array from the data
    const wordsData = data.toLowerCase().split(/[''-.,\s]/);

    // Sanitise data
    const wordsArray = sanitizeData(wordsData);

    // console.log(wordsArray);
    // return

    const requests = wordsArray.map(word => getDictLookup(word.name, word.total).then(a => a));
    body.classList.add('loading');
    Promise
        .all(requests)
        .then(data => {
            body.classList.remove('loading');
            outputWindow.textContent = JSON.stringify(data, undefined, 4);
        })
        .catch(err => console.log(err));
}

console.log(getData());

function sanitizeData(data) {
    // Count the occurence of each word and store in array as value => key pair
    const wordsMap = {};
    data.forEach(word => {
        // Add word to wordsMap as key
        word = word.trim();
        if (wordsMap.hasOwnProperty(word)) {
            wordsMap[word]++;
        } else {
            wordsMap[word] = 1;
        }
    });

    // Create a words map to store the count of each word in wordsArray
    let dataArray = [];
    dataArray = Object.keys(wordsMap).map((word) => {
        if (word.length > 3 && !skippedWords.includes(word)) {
            return {
                name: word,
                total: wordsMap[word]
            };
        }
    });

    // sort by total count in descending order
    dataArray.sort((a, b) => b.total - a.total);

    dataArray = dataArray.slice(0, 10);

    return dataArray;
}