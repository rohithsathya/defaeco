export class DefaecoVendor{
    id:string;
    name:string;
    address:string = "Flat No. 100 , Triveni Apartments, J P Nagara.";
    rating:number = 3;
    areaNames:string[] = ['Vijayanagara'];
    city:string = 'Bangalore';
    services:string = 'Carwash and car detailing';
    noOfBays:number = 3;
    basicBays:string[] = ["B1","B2"];
    premiumBays:string[] = ["B3"];
    packageMatrix:DefaecoVendorPackage[] = [];
    shopCloseTime:number = 20; //1 = 1hr *** 0.5 = 30 min
    shopOpenTime:number=9;
    slotDuration:number=0.5;
    meta:any;

}

export class DefaecoVendorPackage{
    code:string;
    packageName:string;
    noOfSlotsNeeded:number;
    type:string;
    price:number;
    description:string;
    addOns:DefaecoVendorPackageAddons[] = [];
    meta:any;
}

export class DefaecoVendorPackageAddons{
    code:string;
    packageCode:string;
    name:string;
    noOfSlotsNeeded:number;
    type:string;
    price:number;
    description:string;
    meta:any = {};
}