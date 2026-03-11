let stories = []

async function loadStories(){

const index = await fetch("content/stories/index.json")
.then(r => r.json())

stories = index

renderList()

}

function renderList(){

const list = document.getElementById("storyList")

list.innerHTML = ""

const query =
document.getElementById("search").value.toLowerCase()

stories
.filter(story =>
story.title.toLowerCase().includes(query)
)
.forEach(story => {

const div = document.createElement("div")

div.className = "story-item"

div.innerHTML = `
<strong>${story.title}</strong>
<div class="story-meta">
${story.date} • ${story.pages} pages
</div>
`

div.onclick = () => openStory(story.file)

list.appendChild(div)

})

}

async function openStory(file){

const raw =
await fetch("content/stories/" + file)
.then(r => r.text())

const body =
raw.split("---").slice(2).join("---")

const html = marked.parse(body)

document.getElementById("reader").innerHTML = html

}

function showPage(page){

["home","about","stories"].forEach(id => {

document
.getElementById(id)
.classList.add("hidden")

})

document
.getElementById(page)
.classList.remove("hidden")

}

function toggleTheme(){

document.body.classList.toggle("dark")

}

document
.getElementById("search")
.addEventListener("input", renderList)

window.addEventListener("scroll", () => {

const doc = document.documentElement

const scrolled =
(doc.scrollTop) /
(doc.scrollHeight - doc.clientHeight)

* 100

document
.getElementById("progress")
.style.width = scrolled + "%"

})

loadStories()
