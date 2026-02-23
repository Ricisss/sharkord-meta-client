import type { ServerData } from "@/interfaces/ServerData";

export const getInjectionScript = (server: ServerData) => `
(function() {
    //Autologin function
    const identity = ${JSON.stringify(server.identity)};
    const password = ${JSON.stringify(server.password)};

    function setReactInputValue(input, value) {
        if (!input) return;
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(input, value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            input.value = value;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        const inputs = document.querySelectorAll('input');
        const buttons = Array.from(document.querySelectorAll('button'));
        const connectButton = buttons.find(b => b.textContent.trim() === 'Connect');

        if (inputs.length >= 2 && connectButton) {
            setReactInputValue(inputs[0], identity);
            setReactInputValue(inputs[1], password);

            if (!connectButton.disabled) {
                connectButton.click();
                setTimeout(() => {
                    connectButton.click();
                }, 100);
                clearInterval(interval);
            }
        }

        if (attempts > 100) { // Safety timeout after ~50 seconds
            clearInterval(interval);
        }
    }, 500);

    //video double click handler
    document.addEventListener('dblclick', (event) => {
        const video = event.target.closest('video');

        if (video) {
            if (video.requestFullscreen) {
                video.requestFullscreen();
            } else if (video.webkitRequestFullscreen) { /* Safari */
                video.webkitRequestFullscreen();
            } else if (video.msRequestFullscreen) { /* IE11 */
                video.msRequestFullscreen();
            }
        }
    });
})();
`;

