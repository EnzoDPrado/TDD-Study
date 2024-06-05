import { CacheStore } from "@/data/protocols/cache";
import { LocalSavePurchases } from "@/data/usecases/index";
import { SavePurchases } from "@/domain/index";

class CacheStoreSpy implements CacheStore {
  deleteCallsCount = 0;
  insertCallsCount = 0;
  deleteKey: string;
  insertKey: string;
  insertValues: Array<SavePurchases.Params> = []

  insert(key: string, value:any): void {
    this.insertCallsCount++;
    this.insertKey = key;
    this.insertValues = value
  }

  delete(key: string): void {
    this.deleteCallsCount++;
    this.deleteKey = key;
  }

  simulateDeleteError (): void {
    jest.spyOn(CacheStoreSpy.prototype, "delete").mockImplementationOnce(() => {
        throw new Error();
      });
  }

  simulateInsertError (): void {
    jest.spyOn(CacheStoreSpy.prototype, "delete").mockImplementationOnce(() => {
        throw new Error();
      });
  }
}

type SutTypes = {
  sut: LocalSavePurchases;
  cacheStore: CacheStoreSpy;
};

const mockPurchases = (): Array<SavePurchases.Params> => [
  {
    id: "1",
    date: new Date(),
    value: 51,
  },
  {
    id:'2',
    date: new Date(),
    value: 643
}
];

const makeSut = (): SutTypes => {
  const cacheStore = new CacheStoreSpy();
  const sut = new LocalSavePurchases(cacheStore);
  return {
    sut,
    cacheStore,
  };
};

describe("LocalSavePurchases", () => {
  test("Should not delete cache on sut.init", () => {
    const { cacheStore } = makeSut();
    expect(cacheStore.deleteCallsCount).toBe(0);
  });

  test("Should delete old cache on sut.save", async () => {
    const { cacheStore, sut } = makeSut();
    await sut.save(mockPurchases());
    expect(cacheStore.deleteCallsCount).toBe(1);
    expect(cacheStore.deleteKey).toBe("purchases");
  });

  test("Should not insert new Cache if delete fails", () => {
    const { cacheStore, sut } = makeSut();
    cacheStore.simulateDeleteError()
    const promisse = sut.save(mockPurchases());
    expect(cacheStore.insertCallsCount).toBe(0);
    expect(promisse).rejects.toThrow();
  });

  test("Should insert new cache if delete succeeds", async () => {
    const { cacheStore, sut } = makeSut();
    const purchases = mockPurchases();
    await sut.save(purchases);
    expect(cacheStore.deleteCallsCount).toBe(1);
    expect(cacheStore.insertCallsCount).toBe(1);
    expect(cacheStore.insertKey).toBe("purchases");
    expect(cacheStore.insertValues).toEqual(purchases);
  });

  test("Should throw if insert throws", () => {
    const { cacheStore, sut } = makeSut();
    cacheStore.simulateInsertError()
    const promisse = sut.save(mockPurchases());
    expect(promisse).rejects.toThrow();
  });

});
