const FILE_URL = "http://norvig.com/big.txt";
const API_URL = "https://dictionary.yandex.net/api/v1/dicservice.json/lookup";
const API_KEY = "dict.1.1.20170610T055246Z.0f11bdc42e7b693a.eefbde961e10106a4efa7d852287caa49ecc68cf";
const skippedWords = ["into", "there", "were", "although", "even", "though", "while", "unless", "until", "provided", "that", "assuming", "that", "case", "lest", "than", "rather", "than", "whether", "much", "whereas", "after", "long", "soon", "before", "time", "that", "once", "since", "till", "until", "when", "whenever", "while", "because", "since", "that", "order", "that", "what", "whatever", "which", "whichever", "whoever", "whom", "whomever", "whose", "though", "where", "wherever", "just", "both", "hardly", "when", "scarcely", "when", "either", "neither", "then", "what", "with", "whether", "only", "also", "sooner", "than", "rather", "than", "also", "besides", "furthermore", "likewise", "moreover", "Similar", "however", "nevertheless", "nonetheless", "still", "conversely", "instead", "otherwise", "rather", "Similar", "accordingly", "consequently", "hence", "meanwhile", "then", "therefore", "thus"];
const MAX_LEN = 5;

const body = document.querySelector("body");
const outputWindow = document.querySelector("#json");

/* fetch file url */
const getData = async () => {

    try {

        /* Step 1: start the fetch and obtain a reader */
        let response = await fetch('https://cors-anywhere.herokuapp.com/' + FILE_URL);

        const reader = response.body.getReader();

        /* Step 3: read the data */
        let receivedLength = 0;
        let chunks = [];
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            chunks.push(value);
            receivedLength += value.length;
        }

        /* Step 4: concatenate chunks into single Uint8Array */
        let chunksAll = new Uint8Array(receivedLength);
        let position = 0;
        for (let chunk of chunks) {
            chunksAll.set(chunk, position);
            position += chunk.length;
        }

        /* Step 5: decode into a string */
        const data = new TextDecoder("utf-8").decode(chunksAll);

        /* Create word array from the data */
        const wordsData = data.toLowerCase().split(/[''-.,\s]/);

        /* Sanitise data */
        const wordsArray = await sanitizeData(wordsData);

        const requests = wordsArray.map(word => getSynonyms(word.name, word.total));
        body.classList.add('loading');
        Promise
            .all(requests)
            .then(data => {
                body.classList.remove('loading');
                outputWindow.textContent = JSON.stringify(data, undefined, 4);
                console.log(data);
            })
            .catch(err => console.log(err));

    } catch (error) {
        console.error(error)
    }

}

console.log(getData());

/* Async get data from dictionary lookup */
async function getSynonyms(word, count) {
    const resp = await fetch(`${API_URL}?key=${API_KEY}&lang=en-en&text=${word}`);
    const data = await resp.json();

    const synonyms = data.def.length > 0 ? data.def[0].tr.map(data => data.text) : null;
    const pos = data.def.length > 0 ? data.def[0].pos : null;
    return {
        word,
        output: {
            count,
            pos: pos,
            synonyms: synonyms,
        }
    };
}

function sanitizeData(words) {
    /* Count the occurence of each word and store in array as value => key pair */
    const wordsMap = {};
    words.forEach(word => {
        /* Add word to wordsMap as key */
        word = word.trim();
        if (wordsMap.hasOwnProperty(word)) {
            wordsMap[word]++;
        } else {
            wordsMap[word] = 1;
        }
    });

    /* Create a words map to store the count of each word in wordsArray */
    let wordsArray = [];
    wordsArray = Object.keys(wordsMap).map((word) => {
        if (word.length >= MAX_LEN && !skippedWords.includes(word)) {
            return {
                name: word,
                total: wordsMap[word]
            };
        }
    });

    /* sort by total count in descending order */
    wordsArray.sort((a, b) => b.total - a.total);

    wordsArray = wordsArray.slice(0, 10);

    return wordsArray;
}