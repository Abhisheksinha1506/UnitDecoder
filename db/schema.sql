-- units table
CREATE TABLE units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    base_unit TEXT NOT NULL,
    conversion_factor REAL NOT NULL,
    description TEXT,
    region TEXT,
    era TEXT,
    source_url TEXT,
    status TEXT DEFAULT 'verified'
);

-- aliases table (multi-name support)
CREATE TABLE aliases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER NOT NULL,
    alias TEXT NOT NULL,
    normalized_alias TEXT NOT NULL,
    phonetic_key TEXT NOT NULL,
    FOREIGN KEY (unit_id) REFERENCES units (id)
);


-- Create indexes for performance
CREATE INDEX idx_aliases_normalized ON aliases(normalized_alias);
CREATE INDEX idx_aliases_phonetic ON aliases(phonetic_key);

-- Additional performance indexes
CREATE INDEX idx_units_category ON units(category);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_units_region ON units(region);
CREATE INDEX idx_aliases_unit_id ON aliases(unit_id);
