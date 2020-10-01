function addScript(src) {
  const { head } = document;

  const isAdded = Array.from(head.getElementsByTagName("script")).some(
    // here we check if the script has already been added to the page
    s => s.src === src
  );

  if (!isAdded) {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = src;
    head.appendChild(script);
  }
  return isAdded;
}

export default addScript;
