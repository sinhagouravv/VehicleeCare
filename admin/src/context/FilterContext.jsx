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
    useEffect(() => {
        filterConfigRef.current = filterConfig;
    }, [filterConfig]);

    const activeFiltersRef = useRef(activeFilters);
    useEffect(() => {
        activeFiltersRef.current = activeFilters;
    }, [activeFilters]);

    const prevPathRef = useRef(location.pathname);
    const configPathRef = useRef(location.pathname);

    // Reset when changing routes
    useEffect(() => {
        if (prevPathRef.current !== location.pathname) {
            prevPathRef.current = location.pathname;
            setIsFilterOpen(false);
            setIsSortOpen(false);
            setIsLabelMode(false);
            // Only clear config if the new route didn't already register one during mount
            if (configPathRef.current !== location.pathname) {
                setFilterConfigState(null);
                setActiveFilters({});
                setResultsCount(null);
            }
        }
    }, [location.pathname]);

    const setFilterConfig = useCallback((config) => {
        if (!config) {
            setFilterConfigState(null);
            setActiveFilters({});
            return;
        }
        configPathRef.current = location.pathname;
        setFilterConfigState(config);
        setActiveFilters((prev) => {
            const next = { ...prev };
            if (config.initialValues) {
                Object.entries(config.initialValues).forEach(([k, v]) => {
                    if (next[k] === undefined && v !== undefined) {
                        next[k] = v;
                    }
                });
            }
            if (config.groups) {
                config.groups.forEach((g) => {
                    if (next[g.id] === undefined) {
                        next[g.id] = config.initialValues?.[g.id] ?? g.defaultValue ?? 'all';
                    }
                });
            }
            if (next.sortOrder === undefined) next.sortOrder = config.initialValues?.sortOrder ?? 'latest';
            if (next.timeRange === undefined) next.timeRange = config.initialValues?.timeRange ?? 'all';
            return next;
        });
    }, []);

    const setFilterValue = useCallback((groupId, value) => {
        const next = { ...activeFiltersRef.current, [groupId]: value };
        setActiveFilters(next);
        if (filterConfigRef.current?.onChange) {
            filterConfigRef.current.onChange(next);
        }
    }, []);

    const resetFilters = useCallback(() => {
        const defaultFilters = {};
        if (filterConfigRef.current?.groups) {
            filterConfigRef.current.groups.forEach((g) => {
                defaultFilters[g.id] = g.defaultValue || 'all';
            });
        }
        defaultFilters.sortOrder = 'latest';
        defaultFilters.timeRange = 'all';
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
