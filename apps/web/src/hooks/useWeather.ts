'use client';

import { useState, useEffect } from 'react';

interface WeatherData {
  temp: string;
  condition: string;
  emoji: string;
  city: string;
}

const weatherCodeToEmoji = (code: number): string => {
  if (code === 0) return '☀️';
  if (code <= 3) return '🌤️';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '🌨️';
  if (code <= 99) return '⛈️';
  return '🌤️';
};

const weatherCodeToText = (code: number): string => {
  if (code === 0) return '晴';
  if (code <= 3) return '多云';
  if (code <= 48) return '雾';
  if (code <= 57) return '毛毛雨';
  if (code <= 67) return '雨';
  if (code <= 77) return '雪';
  if (code <= 82) return '阵雨';
  if (code <= 86) return '阵雪';
  if (code <= 99) return '雷暴';
  return '晴';
};

async function getCoords(city: string): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`);
    const data = await r.json();
    const result = data?.results?.[0];
    if (result) return { lat: result.latitude, lon: result.longitude, name: result.name };
  } catch {}
  // fallback: 北京
  return { lat: 39.9042, lon: 116.4074, name: city };
}

export function useWeather(city: string) {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    getCoords(city).then((coords) => {
      if (!coords) { setWeather({ temp: '—°C', condition: '—', emoji: '🌤️', city }); return; }
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code&timezone=Asia/Shanghai`)
        .then((r) => r.json())
        .then((data) => {
          const current = data?.current;
          if (!current) { setWeather({ temp: '—°C', condition: '—', emoji: '🌤️', city: coords.name }); return; }
          const temp = Math.round(current.temperature_2m);
          const code = current.weather_code;
          setWeather({ temp: `${temp}°C`, condition: weatherCodeToText(code), emoji: weatherCodeToEmoji(code), city: coords.name });
        })
        .catch(() => setWeather({ temp: '—°C', condition: '加载失败', emoji: '🌤️', city: coords.name }));
    });
  }, [city]);

  return weather;
}
