import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAllServices, getAllDemands } from '../services/item.service';

const RechartsSample = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const services = await getAllServices() || [];
                const demands = await getAllDemands() || [];
                const map = {};

                // combine for last 6 months
                const now = new Date();
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
                    map[key] = { month: key, services: 0, demands: 0 };
                }

                services.forEach(item => {
                    const d = new Date(item.created_at);
                    const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
                    if (map[key]) map[key].services += 1;
                });
                demands.forEach(item => {
                    const d = new Date(item.created_at);
                    const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
                    if (map[key]) map[key].demands += 1;
                });

                setData(Object.values(map));
            } catch (error) {
                console.error('RechartsSample fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div>Loading chart data...</div>;

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" />
                <Line type="monotone" dataKey="services" name="Services" stroke="#8884d8" />
                <Line type="monotone" dataKey="demands" name="Demands" stroke="#82ca9d" />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default RechartsSample;
