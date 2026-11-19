import {
  EMPTY_SELL_FORM,
  fromSellRequest,
  toSellPayload,
} from '../src/context/SellFlowContext';
import {
  dealProgress,
  enquiryBadge,
  enquiryBucket,
  enquiryNote,
  isUpcoming,
} from '../src/screens/profile/enquiryShared';
import type { BuyEnquiry } from '../src/types/enquiry';
import type { SellRequest } from '../src/types/sellRequest';
import type { Visit } from '../src/types/visit';
import { isoDate } from '../src/utils/format';

describe('sell flow payloads', () => {
  it('builds the sell request body the validators accept', () => {
    const payload = toSellPayload(
      {
        ...EMPTY_SELL_FORM,
        typeId: '3d-print',
        title: '  Bright 3 BHK  ',
        bhk: '3',
        builtUp: '1450',
        floor: '7',
        totalFloors: '12',
        age: '1–5 years',
        building: 'Sunrise Heights',
        locality: 'Adyar',
        pin: '600020',
        water: true,
        zoning: 'Residential',
        price: '8500000',
        photos: [
          {
            key: 'a',
            uri: 'file://a',
            url: 'https://cdn/a.jpg',
            status: 'done',
          },
          { key: 'b', uri: 'file://b', status: 'uploading' },
        ],
      },
      7,
    );
    expect(payload.propertyType).toBe('3d_printing');
    expect(payload.propertyTitle).toBe('Bright 3 BHK');
    expect(payload.askingPrice).toBe(8500000);
    expect(payload.address).toEqual({
      street: 'Sunrise Heights',
      locality: 'Adyar',
      city: 'Chennai',
      pincode: '600020',
    });
    expect(payload.specifications).toMatchObject({
      bhk: '3',
      builtUpArea: 1450,
      floor: '7',
      totalFloors: 12,
      age: '1–5 years',
      facing: 'East',
      parking: 1,
    });
    expect(payload.amenities).toEqual(
      expect.arrayContaining([
        'Lift',
        'Water source available',
        'Zoning: Residential',
      ]),
    );
    expect(payload.photos).toEqual(['https://cdn/a.jpg']);
    expect(payload.draftStep).toBe(7);
  });

  it('drops an empty price instead of sending 0', () => {
    expect(
      toSellPayload({ ...EMPTY_SELL_FORM, price: '' }).askingPrice,
    ).toBeUndefined();
  });

  it('loads a saved request back into the wizard', () => {
    const req = {
      _id: 's1',
      referenceId: 'SR-1',
      sellerId: 'u1',
      status: 'draft',
      propertyType: 'villa',
      propertyTitle: 'Coastal Villa',
      askingPrice: 24500000,
      address: { street: 'ECR', city: 'Chennai', pincode: '600115' },
      specifications: { bhk: '4', age: '5-10y', parking: 2 },
      amenities: ['Pool', 'Garden', 'Road access: Via main road'],
      photos: ['https://cdn/1.jpg'],
    } as SellRequest;
    const form = fromSellRequest(req);
    expect(form.typeId).toBe('villa');
    expect(form.age).toBe('5–10 years');
    expect(form.parking).toBe(2);
    expect(form.garden).toBe(true);
    expect(form.roadAccess).toBe('Via main road');
    expect(form.amenities).toEqual(['Pool']);
    expect(form.photos[0]).toMatchObject({
      url: 'https://cdn/1.jpg',
      status: 'done',
    });
  });
});

const visit = (over: Partial<Visit>): Visit => ({
  _id: 'v',
  referenceId: 'VS-1',
  buyerId: 'u',
  propertyId: 'p',
  visitDate: '2026-01-01',
  visitType: 'physical',
  status: 'scheduled',
  ...over,
});
const enquiry = (over: Partial<BuyEnquiry>): BuyEnquiry => ({
  _id: 'e',
  referenceId: 'BE-1',
  buyerId: 'u',
  propertyId: 'p',
  preferredContact: 'phone',
  interestType: 'schedule_visit',
  status: 'new',
  ...over,
});

describe('buyer enquiry helpers', () => {
  it('splits closed enquiries into completed and cancelled', () => {
    expect(enquiryBucket(enquiry({ status: 'negotiating' }))).toBe('active');
    expect(
      enquiryBucket(
        enquiry({ status: 'closed', deal: { stage: 'closed' } as any }),
      ),
    ).toBe('completed');
    expect(enquiryBucket(enquiry({ status: 'closed' }))).toBe('cancelled');
    expect(enquiryBadge(enquiry({ status: 'new' }))).toEqual([
      'awaiting',
      'amber',
    ]);
  });

  it('finds upcoming visits for the status note', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const v = visit({ visitDate: isoDate(tomorrow), visitTime: '11:00 AM' });
    expect(isUpcoming(v)).toBe(true);
    expect(
      isUpcoming(visit({ visitDate: isoDate(tomorrow), status: 'cancelled' })),
    ).toBe(false);
    expect(
      enquiryNote(enquiry({ status: 'visit_scheduled', visits: [v] })),
    ).toMatch(/^Visit on .+ · 11:00 AM$/);
    expect(enquiryNote(enquiry({ status: 'new' }))).toBe(
      'Awaiting callback from advisor',
    );
  });

  it('maps deal stages to progress', () => {
    expect(dealProgress('closed')).toEqual({
      label: 'Completed',
      progress: 100,
    });
    expect(dealProgress('lost').progress).toBe(0);
    expect(dealProgress('token_payment').label).toBe('Token Payment');
  });
});
