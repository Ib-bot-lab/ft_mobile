import { useCallback, useEffect, useState } from "react";

// Define types for better type safety
export type Country = {
  name: string;
  code: string;
  flag: string;
  dialCode: string;
};

export const useCountries = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch countries function using async/await pattern
  const fetchCountries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://restcountries.com/v3.1/all?fields=name,cca2,flag,idd"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch countries");
      }

      const data = await response.json();
      // logger.log("countries data", data);

      // Transform the data into a more usable format for mobile
      const formattedCountries: Country[] = data
        .map((country: any) => {
          // Some countries might not have all properties
          if (!country.name?.common || !country.cca2) return null;

          return {
            name: country.name.common,
            code: country.cca2,
            flag: country.flag || getFlagEmoji(country.cca2),
            dialCode: country.idd?.root
              ? `${country.idd.root}${country.idd.suffixes?.[0] || ""}`
              : "",
          };
        })
        .filter(Boolean) // Remove null entries
        .sort((a: Country, b: Country) => a.name.localeCompare(b.name));

      setCountries(formattedCountries);
    } catch (error: any) {
      setError(error.message || "Failed to fetch countries");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper function to get flag emoji from country code
  const getFlagEmoji = (countryCode: string): string => {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Fetch countries on component mount
  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // Method to refresh data
  const refresh = () => {
    fetchCountries();
  };

  // Search functionality
  const searchCountries = (query: string): Country[] => {
    if (!query.trim()) return countries;

    const searchTerm = query.toLowerCase();
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchTerm) ||
        country.dialCode.includes(searchTerm)
    );
  };

  return {
    countries,
    isLoading,
    error,
    refresh,
    searchCountries,
  };
};
