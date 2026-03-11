const stories = [

{
title:"Mayfly Season",
date:"2026",
pages:14,
desc:"A fisherman matches a hatch that should not exist."
},

{
title:"The Fog Beneath the Bridge",
date:"2025",
pages:11,
desc:"Something waits beneath the tide-choked pylons."
},

{
title:"Stone Lanterns",
date:"2024",
pages:9,
desc:"A trail of lanterns appears where no path exists."
}

]


const list = document.getElementById("storyList")
const cards = document.getElementById("storyCards")


function render(data){

list.innerHTML=""
cards.innerHTML=""

data.forEach(story => {

const li = document.createElement("li")
li.textContent = story.title
list.appendChild(li)


const card = document.createElement("div")
card.className = "card"

card.innerHTML = `

<h3>${story.title}</h3>

<p>${story.desc}</p>

<small>
${story.pages} pages • ${story.date}
</small>

<br><br>

<a href="#">Read</a>
<a href="#">PDF</a>
<a href="#">EPUB</a>

`

cards.appendChild(card)

})

}


render(stories)



document.getElementById("search").addEventListener("input", e => {

const q = e.target.value.toLowerCase()

const filtered = stories.filter(story =>
story.title.toLowerCase().includes(q)
)

render(filtered)

})


document.getElementById("modeToggle").onclick = () => {

document.body.classList.toggle("light")

}
