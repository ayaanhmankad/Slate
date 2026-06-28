const display = document.getElementById("display");
const buttons = document.querySelectorAll(".btn, .sqr");

buttons.forEach(button => {
    button.addEventListener("click", () => {
        const value = button.dataset.value;

        // Clear display
        if (button.id === "clear") {
            display.value = "";
            return;
        }

        // Backspace
        if (button.id === "backspace") {
            display.value = display.value.slice(0, -1);
            return;
        }

        // Calculate
        if (button.id === "equals") {
            calculate();
            return;
        }

        // Square Root
        if (value === "√") {
            try {
                const num = eval(display.value);
                display.value = Math.sqrt(num);
            } catch {
                display.value = "Error";
            }
            return;
        }

        // Square
        if (value === "²") {
            try {
                const num = eval(display.value);
                display.value = Math.pow(num, 2);
            } catch {
                display.value = "Error";
            }
            return;
        }

        // Cube
        if (value === "³") {
            try {
                const num = eval(display.value);
                display.value = Math.pow(num, 3);
            } catch {
                display.value = "Error";
            }
            return;
        }

        // Power operator (^)
        if (value === "^") {
            display.value += "**"; // JavaScript exponent operator
            return;
        }

        // Add normal button value
        display.value += value;
    });
});

function calculate() {
    try {
        let expression = display.value;

        // Replace ^ with **
        expression = expression.replace(/\^/g, "**");

        display.value = eval(expression);
    } catch {
        display.value = "Error";
    }
}

// Optional: Allow keyboard input
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        calculate();
    } else if (e.key === "Backspace") {
        display.value = display.value.slice(0, -1);
    } else if (e.key === "Escape") {
        display.value = "";
    }
});