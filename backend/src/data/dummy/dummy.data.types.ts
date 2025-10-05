export interface FeatureLineString {
    type: "Feature";
    properties: { [key: string]: number | string };
    geometry: {
        coordinates: number[][];
        type: "LineString";
    };
}

export interface FeaturePoint {
    type: "Feature";
    properties: { [key: string]: number | string };
    geometry: {
        coordinates: number[];
        type: "Point";
    };
    id?: number;
}

export interface DummyDataLokasi {
    type: string;
    features: (FeatureLineString | FeaturePoint)[];
}
