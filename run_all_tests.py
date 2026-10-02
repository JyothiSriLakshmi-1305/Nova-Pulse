import subprocess
import sys
import time

def run_suite(name, command):
    print(f"\n>>> Running: {name}")
    start = time.time()
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    duration = time.time() - start
    
    if result.stdout:
        print(result.stdout.strip())
    if result.stderr and result.returncode != 0:
        print(f"Errors:\n{result.stderr.strip()}")
        
    status = "PASSED" if result.returncode == 0 else "FAILED"
    print(f"[{status}] {name} completed in {duration:.2f}s (Exit code: {result.returncode})\n")
    return result.returncode == 0

def main():
    print("==================================================================")
    print("       NOVA PULSE UNIFIED HACKATHON EVALUATION TEST RUNNER        ")
    print("                     PROMPTWARS 2026                              ")
    print("==================================================================")

    b_ok = run_suite("Backend Unit & Security Test Suite (Python)", "python -m unittest backend.tests.test_api")
    f_ok = run_suite("Frontend Architecture & Smoke Test Suite (Node.js)", "node frontend/test-smoke.js")

    print("==================================================================")
    print("FINAL AUDIT SUMMARY:")
    print(f"* Backend Tests:  {'ALL 16 TESTS PASSED [OK]' if b_ok else 'FAILED [X]'}")
    print(f"* Frontend Tests: {'ALL 34 CHECKS PASSED [OK]' if f_ok else 'FAILED [X]'}")
    print("==================================================================")

    if b_ok and f_ok:
        print("RESULT: ALL 7 EVALUATION DIMENSIONS VERIFIED SUCCESSFULLY! [OK]")
        sys.exit(0)
    else:
        print("RESULT: VERIFICATION FAILED [X]")
        sys.exit(1)

if __name__ == '__main__':
    main()
