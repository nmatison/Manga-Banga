function coloredManga() {
    // to store links of each chapter
    let links = [];
    // get all chapters displayed in the table
    let chapterList;
    // get all the rows
    let rows;
    // to store download button for easy access
    let pdfButtons = [];
    let zipButtons = [];
    // to store all chapters images for batch Download (store the buttons)
    let chaptersData = [];
    // check if viewing chapters list page
    if(document.querySelector(".main")  !== null){
        chapterList = document.querySelector(".main");
        rows = chapterList.querySelectorAll("li");
        // calling function
        addNote();
        addBatchDownload();
        addDownloadHeader();
        rows = chapterList.querySelectorAll("li");
        addDownloadButtons();
    }
    // add a note for users
    function addNote(){
        let chapterDiv = document.querySelector(".main");
        let note = document.createElement("li");
        note.id = "md-note";
        note.style.fontSize = "x-large";
        note.style.color = "black";
        chapterDiv.insertBefore(note,chapterDiv.firstChild);
    }
    // add a header for download row
    function addDownloadHeader(){
        let downloadHeader = document.createElement("td");
        downloadHeader.textContent = " Download";
        rows[0].appendChild(downloadHeader);
    }
    // add download button for each chapter
    function addDownloadButtons(){
        // i for rows and index is for arrays
        // i start from 1 because 0 is for header
        let index = 0;
        // Do a first pass through to filter out any sort of Section Groupings such as chapters being listed under a volume.
        const skipRow = new Set();
        for (let i = 1; i < rows.length; i++) {
            if (rows[i].querySelector("li") !== null) {
                skipRow.add(i);
            }
        }

        const chapterCount = rows.length - 1 - skipRow.size;
        
        for (let i = 1; i < rows.length; i++) {
            if (skipRow.has(i)) {
                continue;
            }
            let pdfButton = document.createElement("button");
            let zipButton = document.createElement("button");
            pdfButton.textContent = "pdf";
            zipButton.textContent = "zip";
            // disable the button until fetching chapter pages number
            pdfButton.disabled = "true";
            zipButton.disabled = "true";
            // store chapter link
            links[index] = rows[i].querySelector("a").href;
            pdfButton.referrerLink = rows[i].querySelector("a").href;
            // add chapter number and name to button title and trimming extra spaces
            pdfButton.title = rows[i].querySelector("a").textContent;
            pdfButton.title = pdfButton.title.trim();
            zipButton.title = pdfButton.title;
            // create new table cells to append download button for each chapter
            let newCell = document.createElement("td");
            newCell.appendChild(pdfButton);
            newCell.appendChild(zipButton);
            rows[i].appendChild(newCell);
            // storing download button for easy access
            pdfButtons.push(pdfButton);
            zipButtons.push(zipButton);
            // to fetch pages number from chapter link
            let xhttp = new XMLHttpRequest();
            // added id to each xhttp request to know what button called it					
            xhttp.id = index;
            xhttp.chapterCount = chapterCount;
            xhttp.onreadystatechange = function () {
                let waitNote = document.querySelector("span#md-batch-note");
                let id = this.id;
                let chapterCount = this.chapterCount;
                let pdfButton = pdfButtons[id];
                let zipButton = zipButtons[id];
                // in case the page does not exist display and abort request
                if(this.status === 404){
                    pdfButton.textContent = "Not Found";
                    zipButton.style.display = "none";
                    this.abort();
                }
                // if the request succeed
                if (this.readyState === 4 && this.status === 200) {
                    // convert text to html DOM
                    let parser = new DOMParser();
                    let doc = parser.parseFromString(this.responseText, "text/html");
                    let imgs = doc.querySelectorAll("div.page-break > img.wp-manga-chapter-img");
                    pdfButton.imgs = [];
                    zipButton.imgs = [];
                    for(let img of imgs){
                        let src = img.dataset.src !== undefined ? img.dataset.src : img.dataset.lazySrc;
                        src = src === undefined ? img.src : src;
                        if(host === "mangafort.com" && src.indexOf("/uploads/uploads/") !== -1){
                            src = "https://mangafort.com"+src;
                        }
                        pdfButton.imgs.push(src);
                        zipButton.imgs.push(src);
                    }

                    // store the button with all the images for batch download
                    chaptersData[id] = {
                        title: pdfButton.title,
                        images: pdfButton.imgs,
                        referrerLink: links[id]
                    };
                    // check if all buttons are add
                    let len = chaptersData.reduce((acc,cv)=>(cv)?acc+1:acc,0);
                    waitNote.textContent = "wait, "+len+"/"+chapterCount+" Chapters.";
                    if(len === chapterCount){
                        addChaptersToList();
                    }

                    pdfButton.removeAttribute("disabled");
                    zipButton.removeAttribute("disabled");
                    pdfButton.addEventListener("click", function(){embedImages(pdfButton,zipButton,1);});
                    zipButton.addEventListener("click", function(){embedImages(pdfButton,zipButton,2);});
                }
            };
            xhttp.onerror = function (){
                clearConsole();
            };
            xhttp.open("GET", links[index], true);
            xhttp.send();
            // for arrays
            index++;
        }
    }
    // add batch download button
    function addBatchDownload(){
        // add the floatDiv to document body
        let floatDiv = document.createElement("div");
        floatDiv.id = "md-floatDiv";
        floatDiv.classList.add("md-float-modal");
        let floatDivContent = document.createElement("div");
        floatDivContent.classList.add("md-float-modal-content");
        let floatCloseButton = document.createElement("li");
        floatCloseButton.classList.add("md-float-close");
        floatCloseButton.innerHTML = "&times;";

        floatDivContent.appendChild(floatCloseButton);
        floatDiv.appendChild(floatDivContent);
        document.body.appendChild(floatDiv);

        // to close floating div
        floatCloseButton.onclick = function() {
            floatDiv.style.display = "none";
        };

        // create the button that show the floatDiv
        let batchDownloadButton = document.createElement("button");
        batchDownloadButton.textContent = "Batch Download";
        batchDownloadButton.id = "md-batch-download-button";
        batchDownloadButton.title = "Download multiple chapters at once";
        batchDownloadButton.disabled = "true";
        
        let waitNote = document.createElement("span");
        waitNote.textContent = "wait, getting data from all chapters";
        waitNote.id = "md-batch-note";
        let holder = document.createElement("span");
        holder.appendChild(batchDownloadButton);
        holder.appendChild(waitNote);
        // append batch button after the note
        let theNote = document.querySelector("li#md-note");
        theNote.parentElement.insertBefore(holder,theNote.nextElementSibling);

        let floatDivChapterList = document.createElement("select");
        floatDivChapterList.id = "md-float-chapter-list";
        floatDivChapterList.size = 20;
        floatDivChapterList.multiple = true;

        floatDivContent.appendChild(floatDivChapterList);

        let pdfButtonBatch = document.createElement("button");
        pdfButtonBatch.classList.add("md-download-button");
        pdfButtonBatch.textContent = "Download Selected Chapter/s as PDF files";
        let zipButtonBatch = document.createElement("button");
        zipButtonBatch.classList.add("md-download-button");
        zipButtonBatch.textContent = "Download Selected Chapter/s as ZIP files";

        let buttonHolder = document.createElement("span");
        buttonHolder.appendChild(pdfButtonBatch);
        buttonHolder.appendChild(zipButtonBatch);

        floatDivContent.appendChild(buttonHolder);

        pdfButtonBatch.addEventListener("click", function(){
            if(floatDivChapterList.selectedOptions.length > 0){
                batchEmbedImages(pdfButtonBatch,zipButtonBatch,1,floatDivChapterList,batchProgressBar);
            }
        });

        zipButtonBatch.addEventListener("click", function(){
            if(floatDivChapterList.selectedOptions.length > 0){
                batchEmbedImages(pdfButtonBatch,zipButtonBatch,2,floatDivChapterList,batchProgressBar);
            }
        });

        let batchProgressContainer = document.createElement("div");
        batchProgressContainer.classList.add("md-progress-container");
        let batchProgressBar = document.createElement("div");
        batchProgressBar.classList.add("md-progress-bar");
        batchProgressBar.textContent = "0%";
        batchProgressBar.style.display = "none";

        batchProgressContainer.appendChild(batchProgressBar);
        floatDivContent.appendChild(batchProgressContainer);
    }
    // add chapters to list inside floatDiv
    function addChaptersToList(){
        let waitNote = document.querySelector("span#md-batch-note");
        waitNote.textContent = "wait, adding Chapters to list.";
        let floatDivChapterList = document.querySelector("select#md-float-chapter-list");

        for(let i=chaptersData.length-1 ;i>=0 ;i--){
            let option = document.createElement("option");
            option.textContent = chaptersData[i].title;
            option.value = chaptersData[i].title;
            option.imgs = chaptersData[i].images;
            if(option.imgs === 0){
                option.disabled = "true";
            }
            option.ref = chaptersData[i].referrerLink;
            floatDivChapterList.appendChild(option);
        }

        waitNote.textContent = "Its Ready.";
        waitNote.style.display = "none";
        
        let batchDownloadButton = document.querySelector("button#md-batch-download-button");
        batchDownloadButton.onclick = function(){
            let floatDiv = document.querySelector("div#md-floatDiv");
            floatDiv.style.display = "block";
        };
        batchDownloadButton.removeAttribute("disabled");
    }
}