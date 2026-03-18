import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.PROD
        ? 'http://127.0.0.1:5055/api'
        : '/api'
});

export default api;
