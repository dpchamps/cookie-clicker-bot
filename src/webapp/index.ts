const img = document.getElementById('liveStreamImage') as HTMLImageElement;
const ws = new WebSocket('ws://0.0.0.0:3333');

ws.onmessage = (event) => {
    const objectUrl = URL.createObjectURL(event.data);
    img!.src = objectUrl;
};

ws.onclose = () => console.log('WebSocket connection closed');