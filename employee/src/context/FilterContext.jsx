import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const FilterContext = createContext({
    filterConfig: null,
    setFilterConfig: () => {},
    isFilterOpen: false,
    setIsFilterOpen: () => {},
    isSortOpen: false,
    setIsSortOpen: () => {},
    isLabelMode: false,
    setIsLabelMode: () => {},
    activeFilters: {},
    setFilterValue: () => {},
    resetFilters: () => {},
    hasActiveFilters: false,
    resultsCount: null,
    setResultsCount: () => {}
});

export const FilterProvider = ({ children }) => {
    const location = useLocation();
    const [filterConfig, setFilterConfigState] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isLabelMode, setIsLabelMode] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});
    const [resultsCount, setResultsCount] = useState(null);

    const filterConfigRef = useRef(filterConfig);
    filterConfigRef.current = filterConfig;

    const prevPathRef = useRef(location.pathname);

    // Reset when changing routes
    useEffect(() => {
        if (prevPathRef.current !== location.pathname) {
            prevPathRef.current = location.pathname;
            setIsFilterOpen(false);
            setIsSortOpen(false);
            setIsLabelMode(false);
            setFilterConfigState(null);
            setActiveFilters({});
            setResultsCount(null);
        }
    }, [location.pathname]);

    const setFilterConfig = useCallback((config) => {
        setFilterConfigState(config);
        if (!config) {
            setActiveFilters({});
            return;
        }
        setActiveFilters((prev) => {
            const initial = { ...prev };
            if (config?.groups) {
                config.groups.forEach((g) => {
                    if (initial[g.id] === undefined) {
                        initial[g.id] = config.initialValues?.[g.id] ?? g.defaultValue ?? 'all';
                    }
                });
            }
            return initial;
        });
    }, []);

    const setFilterValue = useCallback((groupId, value) => {
        setActiveFilters((prev) => {
            const next = { ...prev, [groupId]: value };
            if (filterConfigRef.current?.onChange) {
                filterConfigRef.current.onChange(next);
            }
            return next;
        });
    }, []);

    const resetFilters = useCallback(() => {
        const defaultFilters = {};
        if (filterConfigRef.current?.groups) {
            filterConfigRef.current.groups.forEach((g) => {
                defaultFilters[g.id] = g.defaultValue || 'all';
            });
        }
        setActiveFilters(defaultFilters);
        if (filterConfigRef.current?.onChange) {
            filterConfigRef.current.onChange(defaultFilters);
        }
        if (filterConfigRef.current?.onReset) {
            filterConfigRef.current.onReset();
        }
    }, []);

    const hasActiveFilters = Boolean(
        filterConfig?.groups?.some((g) => {
            const current = activeFilters[g.id];
            const def = g.defaultValue || 'all';
            return current !== undefined && current !== def;
        })
    );

    return (
        <FilterContext.Provider
            value={{
                filterConfig,
                setFilterConfig,
                isFilterOpen,
                setIsFilterOpen,
                isSortOpen,
                setIsSortOpen,
                isLabelMode,
                setIsLabelMode,
                activeFilters,
                setFilterValue,
                resetFilters,
                hasActiveFilters,
                resultsCount,
                setResultsCount
            }}
        >
            {children}
        </FilterContext.Provider>
    );
};

export const useFilter = () => useContext(FilterContext);
