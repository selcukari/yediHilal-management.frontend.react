export  const randaomColor = () => {
    const colors = ["dark", "#e599f7", "#63e6be", "#66d9e8", "#dee2e6", "#f4a0a0ff", "#C3FF36", "#879ae7ff", "#b2d579ff", "#dabb61ff", "gray", "red", "pink", "grape", "violet",
      "indigo", "blue", "cyan", "teal", "#16e4aaff", "green", "lime", "yellow", "orange", "#5d6c7bff", "#0f3a64ff", "#3f7b4aff", "#9c912aff", "#994478ff", "#3e2c2cff"];
    const index = Math.floor(Math.random() * colors.length);

    return colors[index];
  }