
function findInArray(value:number,array:any[]){
    for(let i=0;i<array.length;i++){
        let el=array[i]
        if(el==value){
          return true
        }
    }
    return false
  }


export function findBestMatchs(db:any,search_word:string){
    let filtered_db:any[]=[]
    let similarity_index=0.5
    let min_num_suggestions=5
    while(similarity_index>0 && filtered_db.length<=min_num_suggestions){
        
        db.forEach((el:any,id:number) => {
            let row_similarity_index=0
            let number_of_words_selected=0
            let site_array=el.site.split(" ") //aggregate similar site words
            let search_words_array=search_word.split(" ")
            site_array.forEach((site:string)=>{
                search_words_array.forEach(search_word_el=>{
                    let similarity=supercompare(search_word_el.toLocaleLowerCase(),site.toLocaleLowerCase())
                    if(similarity>=similarity_index){
                        row_similarity_index+=similarity
                        number_of_words_selected++
                    }
                })
            })
            
            let desc_array=el.description.split(" ")//aggregate similar description words
            desc_array.forEach((description:string)=>{
                search_words_array.forEach(search_word_el=>{

                    let similarity=supercompare(search_word_el.toLocaleLowerCase(),description.toLocaleLowerCase())
                    if(similarity>=similarity_index){
                        row_similarity_index+=similarity
                        number_of_words_selected++
                    }
                })
            })
            
            if(row_similarity_index>0){
                //check if already push this id into filtered_db
                if(!findInArray(id,filtered_db.map(el=>el[0]))){

                    filtered_db.push([id,(row_similarity_index/number_of_words_selected)])
                }
            }
        });
        if(filtered_db.length<=min_num_suggestions){
            similarity_index-=0.05
        }else{
            similarity_index+=0.05
        }
    }
    //order array by row_similarity_index and get only de db row
    return filtered_db.sort((a,b)=>(a[1]>b[1])?-1:1).map(el=>el[0])

}


function supercompare(search_word:string, word:string) {
    //Second method
    var matches = 0;
    var missMatches = 0;
    var word_freq:any = {}
    var search_freq:any = {}
    for (var i = 0; i < word.length; i++) {
        //if not exists
        if (word_freq[word[i]] == null) {
            word_freq[word[i]] = 1;
        } //already exists
        else {
            var count = word_freq[word[i]];
            count++;
            word_freq[word[i]] = count;
        }
    }
    for (var i = 0; i < search_word.length; i++) {
        //if not exists
        if (search_freq[search_word[i]] == null) {
            search_freq[search_word[i]] = 1;
        } //already exists
        else {
            var count = search_freq[search_word[i]];
            count++;
            search_freq[search_word[i]] = count;
        }
    }
    //
    matches = 0;
    missMatches = 0;
    for (var key in search_freq) {
        //both have same letter
        if (search_freq[key] != null && word_freq[key] != null) {


            //
            if (search_freq[key] == word_freq[key]) {
                matches += search_freq[key];
            } else {
                //give the lowest value of matches
                matches += (search_freq[key] < word_freq[key]) ? search_freq[key] : word_freq[key];
                var difference = Math.abs(search_freq[key] - word_freq[key]);
                missMatches += difference;
            }

        } else {
            missMatches++;
        }
    }
    //count missmatches if word bigger than search word
    for (var key in word_freq) {
        if (search_freq[key] == null && word_freq[key] != null) {
            missMatches++;
        }
    }
    //adding a new compare index
    var index_supplement = indexSuplement(word, search_word)

    var compare_index = matches / (matches + missMatches)
    //
    return compare_index + index_supplement;

}

function indexSuplement(word:string, search_word:string) {
    if (search_word.length >= 3)
        return (search_word[0] == word[0] && search_word[1] == word[1] && search_word[2] == word[2]) ? 0.3 : -0.3
    else {
        if (search_word.length >= 2) {

            return (search_word[0] == word[0] && search_word[1] == word[1]) ? 0.2 : -0.2
        } else {
            if (search_word.length >= 1) {
                return (search_word[0] == word[0]) ? 0.1 : -0.1
            } else {
                return 0
            }
        }
    }

}