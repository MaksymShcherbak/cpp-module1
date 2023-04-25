import './App.css';
import { useState, useEffect } from 'react';
import Select from 'react-select';

function startsWithNumber(str) {
  return /^\d/.test(str);
}

const sortModes = [
  { value: "title", label: "Title" },
  { value: "category", label: "Category" }
];

function compare(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function sortFunction(mode) {
  if (mode == "title") {
    return function (a, b) {
      let cmp = compare(a.title, b.title);
      if (cmp == 0) cmp = compare(a.category, b.category);
      return cmp;
    };
  }
  else {
    return function (a, b) {
      let cmp = compare(a.category, b.category);
      if (cmp == 0) cmp = compare(a.title, b.title);
      return cmp;
    };
  }
}

function App() {
  let [libraries, setLibraries] = useState([]);
  let [count, setCount] = useState(20);
  let [sortMode, selectSortMode] = useState(sortModes[0]);
  let [timeSpent, setTimeSpent] = useState(0);

  let update = () => {
    let start = new Date();
    fetch("http://localhost:8080")
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const root = doc.querySelector("ul[class=cat]");
        const sections = Array.from(root.children);

        let libraries = [];
        outer: for (let section of sections) {
          let category = section
            .firstElementChild // div
            .firstElementChild // a
            .firstElementChild // h3
            .innerText;
          let libs = Array.from(section.lastElementChild.children).slice(0, 5);
          inner: for (let lib of libs) {
            let child = lib.firstElementChild;
            if (!startsWithNumber(child.innerText)) {
              libraries.push({ title: child.innerText, desc: child.title, category });
            }
            if (libraries.length == count) break outer;
          }
        }

        libraries.sort(sortFunction(sortMode.value));

        let end = new Date();
        setTimeSpent((end.getTime() - start.getTime()) / 1000);
        setLibraries(libraries);
      })
      .catch((err) => console.error(err));
  };

  let download = () => {

    const csvString = [
      [
        "Title",
        "Description",
        "Category"
      ],
      ...libraries.map(lib => [
        lib.title,
        '"' + lib.desc + '"',
        lib.category
      ])
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvString], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "libraries.csv";
    link.href = url;
    link.click();
  };

  useEffect(() => update(), []);

  return (
    <div className="App">
      <h1>Rust Libraries</h1>
      <div className="menu">
        <div>
          <label>Number of items</label>
          <input type="number" value={count} min="1" onChange={(event) => setCount(event.target.value)}></input>
        </div>
        <div>
          <label>Sort By</label>
          <Select value={sortMode} onChange={(option) => selectSortMode(option)} options={sortModes} />
        </div>
        <button onClick={update}>Update</button>
      </div>
      <table><tbody><tr><th>#</th><th>Title</th><th>Description</th><th>Category</th></tr>
        {libraries.map((lib, index) => <tr key={index}>
          <td>{index + 1}</td><td>{lib.title}</td>{lib.desc}<td>{lib.category}</td></tr>)}
      </tbody></table>
      <div className="menu">
        <div><p>Time Spent Scraping: {timeSpent}s</p></div>
        <button onClick={download}>Download</button>
      </div>
    </div>
  );
}

export default App;