import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.PROD
        ? 'http://localhost:5000/api'
        : '/api'
});
破
export default api;
