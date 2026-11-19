import {
  activeFilterCount,
  advancedFilterCount,
  toPropertyQuery,
} from '../src/utils/filters';

describe('toPropertyQuery', () => {
  it('maps UI filters to GET /properties query params', () => {
    const q = toPropertyQuery(
      {
        apiType: 'apartment',
        city: ' Chennai ',
        budget: [20, 150],
        area: [400, 2000],
        bhk: ['2', '3'],
        verified: true,
        furnishing: ['Semi-furnished'],
        facing: ['East', 'North'],
        postedBy: 'owner',
        amenities: ['Lift', 'Pool'],
        sort: 'price_asc',
      },
      2,
      20,
    );
    expect(q).toEqual({
      page: 2,
      limit: 20,
      type: 'apartment',
      city: 'Chennai',
      minPrice: 2000000,
      maxPrice: 15000000,
      minArea: 400,
      maxArea: 2000,
      bhk: '2,3',
      verified: true,
      furnishing: 'Semi-furnished',
      facing: 'East,North',
      postedBy: 'owner',
      amenities: 'Lift,Pool',
      sort: 'price_asc',
    });
  });

  it('omits open-ended ranges and merges quick chips', () => {
    const q = toPropertyQuery({
      budget: [0, 300],
      area: [0, 3000],
      underOneCrore: true,
      threePlusBhk: true,
      readyToMove: true,
    });
    expect(q.minPrice).toBeUndefined();
    expect(q.maxPrice).toBe(10000000);
    expect(q.minArea).toBeUndefined();
    expect(q.maxArea).toBeUndefined();
    expect(q.bhk).toBe('3,4,5+');
    expect(q.possession).toBe('Ready to move');
  });

  it('only sends relevance sort with a search term', () => {
    expect(toPropertyQuery({ sort: 'relevance' }).sort).toBeUndefined();
    expect(toPropertyQuery({ sort: 'relevance', search: 'adyar' }).sort).toBe(
      'relevance',
    );
  });
});

describe('filter counts', () => {
  it('counts filter groups and advanced selections', () => {
    expect(
      activeFilterCount({
        city: 'Chennai',
        budget: [20, 150],
        bhk: ['2'],
        facing: ['East'],
      }),
    ).toBe(4);
    expect(activeFilterCount({ budget: [0, 300] })).toBe(0);
    expect(
      advancedFilterCount({
        apiType: 'villa',
        facing: ['East', 'West'],
        postedBy: 'builder',
      }),
    ).toBe(4);
  });
});
